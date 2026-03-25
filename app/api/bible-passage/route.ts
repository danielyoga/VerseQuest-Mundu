import { NextRequest, NextResponse } from "next/server";
import { fetchPassageVersesFromReading } from "@/lib/bible/fetch-passage-verses";
import { parseReadingRange } from "@/lib/bible/schedule";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const book = req.nextUrl.searchParams.get("book");
  const reading = req.nextUrl.searchParams.get("reading");

  if (!book?.trim() || !reading?.trim()) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const bookTrim = book.trim();

  try {
    parseReadingRange(reading.trim());
  } catch {
    return NextResponse.json({ error: "bad_reading" }, { status: 400 });
  }

  try {
    const verses = await fetchPassageVersesFromReading(bookTrim, reading.trim());
    return NextResponse.json({
      verses,
      version: "TB",
      source: "alkitab.mobi",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "unknown_book") {
      return NextResponse.json({ error: "unknown_book" }, { status: 400 });
    }
    if (msg === "passage_too_long") {
      return NextResponse.json({ error: "passage_too_long" }, { status: 400 });
    }
    return NextResponse.json({ error: "lookup_failed" }, { status: 502 });
  }
}
