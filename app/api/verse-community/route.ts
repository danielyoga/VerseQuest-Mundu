import { NextResponse } from "next/server";
import { getCommunityVersesPayload } from "@/lib/google-sheets/verse-community-sheet";

export const runtime = "nodejs";

/**
 * Returns all chapter+verse refs from Today_Community_Verses sheet + unique count.
 * The sheet is admin-managed (pre-curated for today's schedule), not a user submission log.
 */
export async function GET() {
  try {
    const { verses, count } = await getCommunityVersesPayload();
    return NextResponse.json({ ok: true, verses, count });
  } catch (e) {
    console.error("verse-community:", e);
    return NextResponse.json(
      { ok: false, error: "sheet_unavailable", verses: [], count: 0 },
      { status: 502 }
    );
  }
}
