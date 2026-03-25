import { NextRequest, NextResponse } from "next/server";
import { getScheduleForMonthDate } from "@/lib/schedule/from-sheet";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const monthStr = req.nextUrl.searchParams.get("month");
  const dateStr = req.nextUrl.searchParams.get("date");

  if (!monthStr || !dateStr) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const month = Number(monthStr);
  const date = Number(dateStr);
  if (!Number.isFinite(month) || !Number.isFinite(date)) {
    return NextResponse.json({ error: "bad_params" }, { status: 400 });
  }

  try {
    const result = await getScheduleForMonthDate(month, date);
    if (!result.ok) {
      if (result.reason === "no_row") {
        return NextResponse.json({ error: "no_row" }, { status: 404 });
      }
      return NextResponse.json(
        {
          error: result.reason,
          book: result.book,
          reading: result.reading,
          month: result.month,
          date: result.date,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      book: result.book,
      reading: result.reading,
      month: result.month,
      date: result.date,
      verses: result.verses,
    });
  } catch {
    return NextResponse.json({ error: "sheet_unavailable" }, { status: 502 });
  }
}
