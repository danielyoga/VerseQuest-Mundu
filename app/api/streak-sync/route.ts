import { NextRequest, NextResponse } from "next/server";
import { normalizePhone } from "@/lib/preregister";
import {
  buildMergedLocalState,
  mergeSubmissionDateSets,
  normalizeYmdList,
} from "@/lib/streak/sync-merge";
import {
  readSubmissionDatesFromMonthlySheets,
  upsertMergedMarksForPhone,
} from "@/lib/google-sheets/streak-sheet";
import { appendCommunityVerse } from "@/lib/google-sheets/community-verse-sheet";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const phone = normalizePhone(String(body.phone ?? ""));
  if (!phone || phone.length < 10) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const ranting =
    typeof body.ranting === "string" && body.ranting.trim()
      ? body.ranting.trim()
      : undefined;

  const verseToday =
    body.verse_today && typeof body.verse_today === "object"
      ? (body.verse_today as Record<string, unknown>)
      : null;
  const communityVerse =
    verseToday &&
    typeof verseToday.book === "string" &&
    Number.isFinite(Number(verseToday.chapter)) &&
    Number.isFinite(Number(verseToday.verse))
      ? {
          book: verseToday.book,
          chapter: Number(verseToday.chapter),
          verse: Number(verseToday.verse),
          verse_text: typeof verseToday.verse_text === "string" ? verseToday.verse_text : "",
        }
      : null;
  const submission_dates = Array.isArray(body.submission_dates)
    ? body.submission_dates.map((x) => String(x ?? ""))
    : [];
  const localDates = normalizeYmdList(submission_dates);
  const prevXp =
    typeof body.xp_total === "number" && Number.isFinite(body.xp_total)
      ? body.xp_total
      : Number.parseInt(String(body.xp_total ?? "0"), 10) || 0;

  try {
    const remoteDates = await readSubmissionDatesFromMonthlySheets(
      phone,
      localDates,
      ranting
    );
    const merged = mergeSubmissionDateSets(localDates, remoteDates);

    console.log("[streak-sync]", phone, {
      localDates,
      remoteDates,
      merged,
      prevXp,
    });

    // On load-only sync (no verse), only write the current month — previous months
    // are already marked from past syncs, so writing all of them is wasteful.
    const datesToWrite = communityVerse
      ? merged
      : (() => {
          const now = new Date();
          const cy = now.getFullYear();
          const cm = now.getMonth() + 1;
          return merged.filter((d) => {
            const y = parseInt(d.slice(0, 4), 10);
            const m = parseInt(d.slice(5, 7), 10);
            return y === cy && m === cm;
          });
        })();
    await upsertMergedMarksForPhone(phone, name || "—", datesToWrite, ranting);

    if (communityVerse) {
      try {
        await appendCommunityVerse(communityVerse);
      } catch (err) {
        console.error("[community-verse] append failed (non-critical):", err);
      }
    }

    const mergedState = buildMergedLocalState(prevXp, merged);
    console.log("[streak-sync] result", phone, mergedState);
    return NextResponse.json({ ok: true, merged: mergedState });
  } catch (e) {
    console.error("streak-sync:", e);
    return NextResponse.json(
      { ok: false, error: "sheet_unavailable" },
      { status: 502 }
    );
  }
}
