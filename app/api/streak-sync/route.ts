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
import { syncCommunitySheetAfterVerseSubmit } from "@/lib/google-sheets/verse-community-sheet";

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
  const submission_dates = Array.isArray(body.submission_dates)
    ? body.submission_dates.map((x) => String(x ?? ""))
    : [];
  const localDates = normalizeYmdList(submission_dates);
  const prevXp =
    typeof body.xp_total === "number" && Number.isFinite(body.xp_total)
      ? body.xp_total
      : Number.parseInt(String(body.xp_total ?? "0"), 10) || 0;

  /** Used only for Community_Verses tab — streak month tabs stay `v` marks only. */
  let verseToday: { ymd: string; book: string; chapter: number; verse: number } | null =
    null;
  const vt = body.verse_today;
  if (vt && typeof vt === "object") {
    const o = vt as Record<string, unknown>;
    const ymd = String(o.date ?? o.dateYmd ?? "").trim().slice(0, 10);
    const book = String(o.book ?? "").trim();
    const chapter = Number(o.chapter);
    const verse = Number(o.verse);
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(ymd) &&
      book &&
      Number.isFinite(chapter) &&
      Number.isFinite(verse)
    ) {
      verseToday = { ymd, book, chapter, verse };
    }
  }

  try {
    const remoteDates = await readSubmissionDatesFromMonthlySheets(
      phone,
      localDates
    );
    const merged = mergeSubmissionDateSets(localDates, remoteDates);
    await upsertMergedMarksForPhone(phone, name || "—", merged);
    if (verseToday) {
      await syncCommunitySheetAfterVerseSubmit({
        book: verseToday.book,
        chapter: verseToday.chapter,
        verse: verseToday.verse,
      });
    }
    const mergedState = buildMergedLocalState(prevXp, merged);
    return NextResponse.json({ ok: true, merged: mergedState });
  } catch (e) {
    console.error("streak-sync:", e);
    return NextResponse.json(
      { ok: false, error: "sheet_unavailable" },
      { status: 502 }
    );
  }
}
