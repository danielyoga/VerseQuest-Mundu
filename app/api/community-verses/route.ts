import { NextResponse } from "next/server";
import { readCommunityVersesDeduped } from "@/lib/google-sheets/community-verse-sheet";

export const runtime = "nodejs";

export async function GET() {
  const t0 = Date.now();
  try {
    const verses = await readCommunityVersesDeduped();
    console.log(`[community-verses] GET ${Date.now() - t0}ms count=${verses.length}`);
    return NextResponse.json({ verses }, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[community-verses] GET error", err);
    return NextResponse.json({ error: "Gagal memuat." }, { status: 500 });
  }
}
