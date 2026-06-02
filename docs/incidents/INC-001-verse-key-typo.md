# INC-001: Verse Key Typo — All Scheduled Passages Broken (2026-06-01)

## Summary

All 163 scheduled Bible passage rows (March 22 – August 31, 2026) in the Google Sheet had a JSON key typo: `"1erse"` (digit `1` + `"erse"`) instead of `"verse"`. This caused `lookupScheduleForDate` in `lib/schedule/from-sheet.ts` to silently produce 0 verses, yielding a `verses_invalid` schedule state. A compounding caching bug in `lib/schedule/window-cache.ts` made `isUsableCachedScheduleDay` treat `verses_invalid` entries as permanently usable cached hits, so fixing the sheet had no effect for users who had already loaded the broken data — until they cleared localStorage or used an incognito window.

**Affected range:** 2026-03-22 → 2026-08-31 (163 rows, 100% of future schedule)

**Visible symptom:** Home page reading card showed either the amber "verses pending" message or the red "could not load" error. No verses were available for interactive selection or submission.

---

## Timeline (2026-06-01)

| Time | Event |
|------|-------|
| Early reports | Users report "Teks Alkitab tidak dapat dimuat" on the home page |
| Investigation | `/api/schedule-window` response inspected — returned `{"from":"2026-06-01","days":[]}` |
| Caching bug found | Traced `window-cache.ts` → `isUsableCachedScheduleDay` returns `true` for `verses_invalid` entries, making the broken state sticky across page loads |
| Sheet confirmed broken | `GSHEET_RANGE` curl via `gsheet-try.ts` — D73 (today's row) still contained `"1erse"` key |
| Incognito confirms fix path | User opened incognito tab → schedule loaded correctly with fresh localStorage |
| Full audit | Checked all rows 2–164: 163 of 163 had the `"1erse"` bug |
| Data fix | Ran `populate-schedule-verses.ts --force` for months 3, 4, 5, 6, 7, 8 |
| Verification | 163/163 rows confirmed OK, 0 bugs remaining |
| Code fix committed | `isUsableCachedScheduleDay` patched to only return `true` when `day.ok === true` |

---

## Root Causes

1. **Data — typo in verse key column:** The entire sheet's verses column was populated with JSON objects using the key `"1erse"` instead of `"verse"`. This was almost certainly a one-time script or generation error (confusing `1` with `v` in a template string). No validation existed in either the populate script or the sheet reader to catch malformed keys, so the error went undetected at write time and silently produced empty verse arrays at read time.

2. **Code — cache treats broken state as valid:** `isUsableCachedScheduleDay` in `lib/schedule/window-cache.ts` did not check `day.ok`. It returned `true` for any entry that existed in localStorage, including `verses_invalid` entries. Once a user loaded a broken schedule day, that day was locked into a broken state in their local cache until the calendar rolled over to the next day (when the cache key changed) or they manually cleared storage.

---

## Impact

- **Users affected:** All users on any day from 2026-03-22 onward
- **Symptom:** Reading schedule card showed amber "verses pending" or red error state
- **Functionality lost:** Verse text unavailable; interactive verse selection and submission from the reading list were completely broken
- **Duration:** From first population of the affected rows until the data fix was applied and users' localStorage expired or was cleared

---

## Fix

### Data fix
Re-populated all affected months via the force-overwrite flag:

```bash
npx tsx scripts/populate-schedule-verses.ts --force --months 3,4,5,6,7,8
```

### Code fix
`isUsableCachedScheduleDay` in `lib/schedule/window-cache.ts` was changed from accepting any non-undefined entry to only accepting entries where `day.ok === true`:

```ts
// Before (broken)
function isUsableCachedScheduleDay(day: CachedScheduleDay | undefined): boolean {
  return day !== undefined;
}

// After (fixed)
function isUsableCachedScheduleDay(day: CachedScheduleDay | undefined): boolean {
  return day?.ok === true;
}
```

### HTTP cache recommendation
Reduce `stale-while-revalidate` on the `/api/schedule-window` route from 3600 s to 300 s so that a corrected sheet is reflected within 5 minutes for users without a stale localStorage entry.

---

## Why the Preview Branch (test/UI.1.0) Appeared Unaffected

The schedule-window code is byte-for-byte identical between `master` and `test/UI.1.0`. Both branches point to the same Google Sheet. The preview appeared to work because all manual testing of that URL occurred in a fresh browser context (incognito or first load) — no stale `verses_invalid` entry existed in localStorage. `Cache-Control: private` means the HTTP cache does not apply at the CDN level, so there was no CDN-level stale response either.

---

## Prevention

- **Daily health-check:** A scheduled job (cron or GitHub Actions) reads the upcoming 14 days from the sheet and validates that every row's verses key is `"verse"` and the value is a non-empty array. See `docs/testing/health-check-strategy.md`.
- **Unit tests for `lookupScheduleForDate`:** Add test cases covering `verses_invalid` edge cases, including the `"1erse"` typo pattern.
- **Populate script validation:** Before writing a row, validate that the JSON object to be written has a `"verse"` key and that its value is a non-empty array. Abort and report on any row that fails this check.
- **Sheet-level validation:** Add a Google Sheets data validation rule or Apps Script trigger that rejects cells in the verses column whose JSON does not parse to an object with a `"verse"` key.
