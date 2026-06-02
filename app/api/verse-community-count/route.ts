import { NextResponse } from "next/server";
import { getCommunityUniqueVerseCount } from "@/lib/google-sheets/verse-community-sheet";
import { serverDebugLog } from "@/lib/log";

export const runtime = "nodejs";

/** Lightweight: unique passage count in Community_Verses tab (for nav badge). */
export async function GET() {
  const t0 = Date.now();
  try {
    const count = await getCommunityUniqueVerseCount();
    serverDebugLog("verse-community-count", `GET ${Date.now() - t0}ms count=${count}`);
    return NextResponse.json({ ok: true, count }, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  } catch (e) {
    console.error("[verse-community-count] GET error", e);
    return NextResponse.json(
      { ok: false, error: "sheet_unavailable", count: 0 },
      { status: 502 }
    );
  }
}
