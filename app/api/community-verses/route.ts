import { NextResponse } from "next/server";
import { readCommunityVersesDeduped } from "@/lib/google-sheets/community-verse-sheet";

export const runtime = "nodejs";

export async function GET() {
  try {
    const verses = await readCommunityVersesDeduped();
    return NextResponse.json({ verses });
  } catch (err) {
    console.error("[community-verses]", err);
    return NextResponse.json({ error: "Gagal memuat." }, { status: 500 });
  }
}
