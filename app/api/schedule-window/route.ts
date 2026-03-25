import { NextRequest, NextResponse } from "next/server";
import { getScheduleWindow } from "@/lib/schedule/from-sheet";

export const runtime = "nodejs";

const DEFAULT_DAYS = 4;
const MAX_DAYS = 7;

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const daysStr = req.nextUrl.searchParams.get("days");

  if (!from?.trim()) {
    return NextResponse.json({ error: "missing_from" }, { status: 400 });
  }

  const fromTrim = from.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromTrim)) {
    return NextResponse.json({ error: "bad_from" }, { status: 400 });
  }

  let days = DEFAULT_DAYS;
  if (daysStr != null) {
    const n = Number(daysStr);
    if (!Number.isFinite(n) || n < 1) {
      return NextResponse.json({ error: "bad_days" }, { status: 400 });
    }
    days = Math.min(Math.floor(n), MAX_DAYS);
  }

  try {
    const body = await getScheduleWindow(fromTrim, days);
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "sheet_unavailable" }, { status: 502 });
  }
}