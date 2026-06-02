/**
 * Layer 2 integration health check — verifies the next 90 days of schedule data.
 *
 * Usage:
 *   HEALTH_CHECK_URL=https://your-app.vercel.app npx tsx scripts/health-check-schedule.ts
 *
 * Exits with code 1 if any day in the window fails validation.
 */

const BASE_URL = process.env.HEALTH_CHECK_URL ?? "http://localhost:3000";
const DAYS_AHEAD = 90;
const WINDOW = 7;

type VerseRow = { chapter: unknown; verse: unknown; text: unknown };
type WindowDay = {
  date?: string;
  ok: boolean;
  reason?: string;
  verses?: unknown[];
};
type WindowResponse = { days?: WindowDay[] };

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isValidVerseRow(v: unknown): v is VerseRow {
  return (
    typeof v === "object" &&
    v !== null &&
    "chapter" in v &&
    "verse" in v &&
    "text" in v
  );
}

async function main() {
  const today = new Date();
  let failed = 0;
  let passed = 0;

  for (let offset = 0; offset < DAYS_AHEAD; offset += WINDOW) {
    const from = formatYmd(addDays(today, offset));
    const url = `${BASE_URL}/api/schedule-window?from=${from}&days=${WINDOW}`;

    let json: WindowResponse;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`${from}  ERROR  HTTP ${res.status}`);
        failed += WINDOW;
        continue;
      }
      json = (await res.json()) as WindowResponse;
    } catch (err) {
      console.error(`${from}  ERROR  fetch failed: ${String(err)}`);
      failed += WINDOW;
      continue;
    }

    for (const day of json.days ?? []) {
      const label = day.date ?? from;

      if (day.ok !== true) {
        console.log(`${label}  FAIL  ${day.reason ?? "unknown"}`);
        failed++;
        continue;
      }

      if (!Array.isArray(day.verses) || day.verses.length === 0) {
        console.log(`${label}  EMPTY`);
        failed++;
        continue;
      }

      if (!day.verses.every(isValidVerseRow)) {
        console.log(`${label}  FAIL  missing verse fields`);
        failed++;
        continue;
      }

      console.log(`${label}  OK`);
      passed++;
    }
  }

  console.log(`\n${passed} OK, ${failed} failed (of ${DAYS_AHEAD} days checked).`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
