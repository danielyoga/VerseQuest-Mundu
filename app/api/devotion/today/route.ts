import { NextResponse } from "next/server";
import DOMPurify from "isomorphic-dompurify";
import { getSheetsClient, getSpreadsheetId } from "@/lib/google-sheets/client";
import { serverDebugLog } from "@/lib/log";
import { getTodaySheetDate } from "@/lib/sheetName";

export const runtime = "nodejs";

const SHEET = "Devotion_and_Reflection";
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes — devotion is stable throughout the day

type DevotionPayload = {
  date?: string;
  devotion: string | null;
  devotionTitle: string | null;
  reflection: string[];
};

let devotionCache: { date: string; data: DevotionPayload; expiresAt: number } | null = null;
let inflight: Promise<DevotionPayload> | null = null;

export async function GET() {
  const t0 = Date.now();
  const today = getTodaySheetDate();

  // Invalidate cache when the date rolls over
  if (devotionCache && devotionCache.date !== today) devotionCache = null;

  if (devotionCache && Date.now() < devotionCache.expiresAt) {
    serverDebugLog("devotion/today", `GET ${Date.now() - t0}ms (cache hit)`);
    return NextResponse.json(devotionCache.data, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  }

  if (inflight) {
    const data = await inflight;
    serverDebugLog("devotion/today", `GET ${Date.now() - t0}ms (inflight)`);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  }

  inflight = (async (): Promise<DevotionPayload> => {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A:D`,
    });

    const rows = res.data.values ?? [];
    const match = rows.slice(1).find((row) => String(row[0] ?? "").trim() === today);

    if (!match) {
      return { devotion: null, devotionTitle: null, reflection: [] };
    }

    const reflection = match[3]
      ? (match[3] as string).split("|").map((s) => s.trim()).filter(Boolean)
      : [];

    return {
      date: match[0] as string,
      devotionTitle: (match[1] as string | undefined)?.trim() || null,
      devotion: match[2] ? DOMPurify.sanitize(match[2] as string) : null,
      reflection,
    };
  })();

  inflight.catch(() => { inflight = null; });

  try {
    const data = await inflight;
    devotionCache = { date: today, data, expiresAt: Date.now() + CACHE_TTL_MS };
    inflight = null;
    serverDebugLog("devotion/today", `GET ${Date.now() - t0}ms (sheets)`);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    inflight = null;
    console.error("[devotion/today]", err);
    return NextResponse.json({ error: "Gagal memuat renungan." }, { status: 500 });
  }
}
