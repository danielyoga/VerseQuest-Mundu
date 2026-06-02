# Schedule Health Check Strategy

Three-layer approach: fast local unit tests, an on-demand integration script, and an automated daily cron.

---

## Layer 1 — Unit Tests

**When:** Run locally and in CI on every commit.

**Framework:** Jest or Vitest (either works; Vitest is preferred for ESM/TypeScript projects without extra config).

**File locations:**

```
__tests__/lib/schedule/
  from-sheet.test.ts
  window-cache.test.ts
  calendar.test.ts
__tests__/lib/bible/
  passage.test.ts
```

### `lookupScheduleForDate` (`from-sheet.ts`)

| Case | Input | Expected output |
|------|-------|----------------|
| Valid data | Row with `"verse"` key, non-empty array | `{ ok: true, verses: [...] }` |
| Typo key | Row with `"1erse"` key | `verses_invalid` state |
| Empty cell | Row with empty string | `verses_invalid` state |
| Non-array JSON | Row with `"verse": {}` | `verses_invalid` state |
| No valid items | Row with `"verse": []` | `verses_empty` state |
| Missing row | No row for date | `no_row` state |

### `isUsableCachedScheduleDay` (`window-cache.ts`)

| Input state | Expected return |
|-------------|----------------|
| `{ ok: true, verses: [...] }` | `true` |
| `{ ok: false, reason: "no_row" }` | `false` |
| `{ ok: false, reason: "verses_empty" }` | `false` |
| `{ ok: false, reason: "verses_invalid" }` | `false` |
| `undefined` | `false` |

### `parseCalendarMonthDayFromRow` (`calendar.ts`)

| Input format | Expected output |
|-------------|----------------|
| `DD/MM/YYYY` (e.g. `01/06/2026`) | `{ day: 1, month: 6, year: 2026 }` |
| `YYYY-MM-DD` (e.g. `2026-06-01`) | `{ day: 1, month: 6, year: 2026 }` |
| Day-only with month column | Uses month column value |
| Day-only with no month column | Falls back to current month |

### `fetchPassageVersesFromReading` (`lib/bible/passage.ts`)

Mock `alkitab.mobi` HTTP calls. Test:

- Happy path: valid book/chapter/verse range returns array of verse objects
- `unknown_book` error: unrecognised book abbreviation → error state with reason
- `passage_too_long` error: range exceeds limit → error state with reason

---

## Layer 2 — Endpoint Integration Test

**When:** Run manually against staging or prod, or triggered in CI against a staging URL.

**Script:** `scripts/health-check-schedule.ts`

### What it does

1. Iterates over the next 90 days in 7-day windows, calling:
   ```
   GET /api/schedule-window?from=YYYY-MM-DD&days=7
   ```
2. For each day in the response:
   - Asserts `day.ok === true`
   - Asserts `day.verses` is a non-empty array
   - Asserts every verse object has `chapter`, `verse`, and `text` keys
3. Prints a per-date summary:
   ```
   2026-06-01  OK
   2026-06-02  OK
   2026-06-03  FAIL  verses_invalid
   2026-06-04  EMPTY
   ```
4. Exits with code `1` if any day is not `OK`.

### Usage

```bash
HEALTH_CHECK_URL=https://your-app.vercel.app npx tsx scripts/health-check-schedule.ts
```

### Script skeleton

```ts
// scripts/health-check-schedule.ts
import { addDays, format } from "date-fns";

const BASE_URL = process.env.HEALTH_CHECK_URL ?? "http://localhost:3000";
const DAYS_AHEAD = 90;
const WINDOW = 7;

async function main() {
  const today = new Date();
  let failed = 0;

  for (let offset = 0; offset < DAYS_AHEAD; offset += WINDOW) {
    const from = format(addDays(today, offset), "yyyy-MM-dd");
    const url = `${BASE_URL}/api/schedule-window?from=${from}&days=${WINDOW}`;
    const res = await fetch(url);
    const json = await res.json();

    for (const day of json.days ?? []) {
      const date = day.date ?? from;
      if (day.ok !== true) {
        console.log(`${date}  FAIL  ${day.reason ?? "unknown"}`);
        failed++;
        continue;
      }
      if (!Array.isArray(day.verses) || day.verses.length === 0) {
        console.log(`${date}  EMPTY`);
        failed++;
        continue;
      }
      const allValid = day.verses.every(
        (v: unknown) =>
          typeof v === "object" &&
          v !== null &&
          "chapter" in v &&
          "verse" in v &&
          "text" in v
      );
      if (!allValid) {
        console.log(`${date}  FAIL  missing verse fields`);
        failed++;
        continue;
      }
      console.log(`${date}  OK`);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} day(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll days OK.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

## Layer 3 — Vercel Cron Job

**When:** Runs automatically every day. Alerts when any day in the next 14 fails validation.

**Requirement:** Vercel Pro plan. For Hobby/free, use the GitHub Actions alternative below.

### `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/schedule-health",
      "schedule": "0 1 * * *"
    }
  ]
}
```

Runs at 01:00 UTC daily — before most users' morning reading time.

### `app/api/cron/schedule-health/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { getScheduleWindow } from "@/lib/schedule/from-sheet";
import { format, addDays } from "date-fns";

const DAYS_TO_CHECK = 14;

export async function GET(req: NextRequest) {
  // Vercel sets Authorization: Bearer <CRON_SECRET> on cron invocations.
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const failed: string[] = [];
  let ok = 0;

  for (let i = 0; i < DAYS_TO_CHECK; i++) {
    const date = format(addDays(today, i), "yyyy-MM-dd");
    const day = await getScheduleWindow(date, 1).then((w) => w.days[0]);

    if (!day || day.ok !== true || !Array.isArray(day.verses) || day.verses.length === 0) {
      failed.push(`${date}: ${day?.reason ?? "missing or empty"}`);
    } else {
      ok++;
    }
  }

  if (failed.length > 0) {
    await sendAlert(failed);
  }

  return NextResponse.json({ ok, failed, checked: DAYS_TO_CHECK });
}

async function sendAlert(failedDates: string[]) {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `[VerseQuest] Schedule health check FAILED\n${failedDates.join("\n")}`,
    }),
  });
}
```

Set `CRON_SECRET` and `ALERT_WEBHOOK_URL` (SeaTalk incoming webhook or any HTTP endpoint) in Vercel environment variables.

### Response shape

```json
{
  "ok": 13,
  "failed": ["2026-06-03: verses_invalid"],
  "checked": 14
}
```

---

## GitHub Actions Alternative (Free Tier)

Use this if the project is on Vercel Hobby plan. Runs the Layer 2 script on a schedule.

```yaml
# .github/workflows/schedule-health.yml
name: Schedule Health Check
on:
  schedule:
    - cron: '0 1 * * *'
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx tsx scripts/health-check-schedule.ts
        env:
          HEALTH_CHECK_URL: ${{ secrets.PRODUCTION_URL }}
```

Set `PRODUCTION_URL` in the repository's Actions secrets. Use `workflow_dispatch` to trigger a manual run from the GitHub Actions UI at any time.
