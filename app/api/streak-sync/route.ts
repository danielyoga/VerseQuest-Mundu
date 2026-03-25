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

  try {
    const remoteDates = await readSubmissionDatesFromMonthlySheets(
      phone,
      localDates
    );
    const merged = mergeSubmissionDateSets(localDates, remoteDates);
    await upsertMergedMarksForPhone(phone, name || "—", merged);
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
