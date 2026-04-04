import { NextResponse } from "next/server";
import { getCommunityVersesPayload, pruneStaleRows } from "@/lib/google-sheets/verse-community-sheet";
import { getScheduleWindow } from "@/lib/schedule/from-sheet";
import { toLocalDateString } from "@/lib/date-utils";
import type { ScheduleWindowDay } from "@/lib/schedule/window-types";

export const runtime = "nodejs";

export type CommunityFullItem = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

function addDays(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

/**
 * Reads Today_Community_Verses refs (already filtered to today via create_date column)
 * and enriches each with book name + verse text from a 21-day schedule window.
 *
 * Past schedule days take priority over future ones when the same chapter:verse
 * appears in two different books (e.g. the current reading block started days ago).
 */
export async function GET() {
  try {
    // Fire-and-forget: prune rows from previous days without blocking the response
    pruneStaleRows().catch((e) => console.error("[verse-community-full] prune error:", e));

    const { verses } = await getCommunityVersesPayload();

    if (verses.length === 0) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const now = new Date();
    // Three windows covering 21 days total: up to 14 days back + today + 6 forward.
    const farPastStart = toLocalDateString(addDays(now, -13));
    const nearPastStart = toLocalDateString(addDays(now, -6));
    const futureStart = toLocalDateString(now);

    const [farPastResult, nearPastResult, futureResult] = await Promise.all([
      getScheduleWindow(farPastStart, 7),
      getScheduleWindow(nearPastStart, 7),
      getScheduleWindow(futureStart, 7),
    ]);

    // Sort days: today first, past before future at same distance.
    const todayMs = now.getTime();
    const allDays: ScheduleWindowDay[] = [
      ...(farPastResult.days ?? []),
      ...(nearPastResult.days ?? []),
      ...(futureResult.days ?? []),
    ].sort((a, b) => {
      const aMs = new Date(a.year, a.month - 1, a.date).getTime();
      const bMs = new Date(b.year, b.month - 1, b.date).getTime();
      const da = aMs - todayMs;
      const db = bMs - todayMs;
      if (da <= 0 && db <= 0) return db - da;
      if (da > 0 && db > 0) return da - db;
      return da <= 0 ? -1 : 1;
    });

    // Build a lookup: "chapter|verse" → { book, text }; first entry (closest to today) wins.
    const lookup = new Map<string, { book: string; text: string }>();
    for (const day of allDays) {
      if (!day.ok) continue;
      for (const row of day.verses) {
        const key = `${row.chapter}|${row.verse}`;
        if (!lookup.has(key)) {
          lookup.set(key, { book: day.book, text: row.text });
        }
      }
    }

    const items: CommunityFullItem[] = verses.map((ref) => {
      const key = `${ref.chapter}|${ref.verse}`;
      const match = lookup.get(key);
      return {
        book: match?.book ?? "",
        chapter: ref.chapter,
        verse: ref.verse,
        text: match?.text ?? "",
      };
    });

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    console.error("verse-community-full:", e);
    return NextResponse.json(
      { ok: false, error: "sheet_unavailable", items: [] },
      { status: 502 }
    );
  }
}
