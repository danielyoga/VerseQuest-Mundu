import { type NextRequest, NextResponse } from "next/server";
import { getCommunityVersesPayload } from "@/lib/google-sheets/verse-community-sheet";

export const runtime = "nodejs";

/**
 * Chapter+verse refs + unique count (single Sheets read; book comes from today’s schedule on the client).
 * Optional `maxRows` = total rows to read including header (e.g. 1 + today’s passage verse count).
 */
export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("maxRows");
    const n =
      raw != null && raw !== "" ? Number.parseInt(raw, 10) : Number.NaN;
    const { verses, count } = await getCommunityVersesPayload(
      Number.isFinite(n) ? n : undefined
    );
    return NextResponse.json({ ok: true, verses, count });
  } catch (e) {
    console.error("verse-community:", e);
    return NextResponse.json(
      { ok: false, error: "sheet_unavailable", verses: [], count: 0 },
      { status: 502 }
    );
  }
}
