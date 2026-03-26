import { NextResponse } from "next/server";
import { getCommunityUniqueVerseCount } from "@/lib/google-sheets/verse-community-sheet";

export const runtime = "nodejs";

/** Lightweight: unique passage count in Community_Verses tab (for nav badge). */
export async function GET() {
  try {
    const count = await getCommunityUniqueVerseCount();
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    console.error("verse-community-count:", e);
    return NextResponse.json(
      { ok: false, error: "sheet_unavailable", count: 0 },
      { status: 502 }
    );
  }
}
