# VerseQuest — Optimization Issues

A record of identified performance, code quality, and architecture issues. Each item is tagged with impact and effort level.

---

## Issue #1 — Duplicate `/api/devotion/today` fetches ✅ Fixed

**Impact:** High | **Effort:** Low

### Problem
Both `VerseQuestApp` and `VerseQuestHome` independently fetch `/api/devotion/today` on every load, resulting in two identical network calls to Google Sheets on each page visit.

- `components/VerseQuestApp.tsx` — fetches to build `firmanConfig` (reflection questions)
- `components/VerseQuestHome.tsx` — fetches to check `devotionAvailable`

### Fix
Fetch once in `VerseQuestApp`, extract both `devotionAvailable` (boolean) and `firmanConfig` from the single response, then pass `devotionAvailable` down as a prop to `VerseQuestHome`.

---

## Issue #2 — No cache headers on `/api/devotion/today`

**Impact:** High | **Effort:** Low

### Problem
The devotion API endpoint hits Google Sheets on every request. The client calls it with `cache: "no-store"` and the server sets no `Cache-Control` header. Since devotion content changes at most once per day, this is unnecessarily expensive.

### Fix
Add `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` to the response (5 min cached, stale-ok for 10 min). Remove the `cache: "no-store"` override on the client side.

---

## Issue #3 — `BottomNav` fetches full community payload for a badge count

**Impact:** Medium | **Effort:** Low

### Problem
`BottomNav` calls `/api/verse-community` (full payload: all verse refs + metadata) just to extract the `count` field for the badge. There is already a dedicated lightweight endpoint `/api/verse-community-count` that returns only the count.

### Fix
Change `BottomNav` to call `/api/verse-community-count` instead of `/api/verse-community`.

---

## Issue #4 — `/api/verse-community-full` makes 3 separate `getScheduleWindow` calls

**Impact:** Medium | **Effort:** Medium

### Problem
`verse-community-full/route.ts` fires three parallel `getScheduleWindow` calls to cover a 21-day window (3 × 7-day windows). Each call hits Google Sheets independently, tripling Sheets API usage for this endpoint.

### Fix
Either extend `getScheduleWindow` to accept a larger window size so a single call covers 21 days, or add a short in-memory / `unstable_cache` layer on `getScheduleWindow` to deduplicate overlapping ranges within the same request cycle.

---

## Issue #5 — Dead code: `useUser.ts` + `lib/session.ts`

**Impact:** Low | **Effort:** Low

### Problem
`hooks/useUser.ts` and `lib/session.ts` (which uses a `versequest_user` localStorage key) are not used anywhere in the main app flow. The real store is `versequest_v1` managed by `hooks/useVerseQuest.ts`. These files add confusion about which key is authoritative.

### Fix
Delete `hooks/useUser.ts` and `lib/session.ts`.

---

## Issue #6 — `verse_today` sent in streak-sync but never consumed

**Impact:** Low | **Effort:** Low

### Problem
`useVerseQuest.ts` includes a `verse_today` object in the `POST /api/streak-sync` body when a verse is submitted, but `app/api/streak-sync/route.ts` never reads or acts on this field. The payload is wasted on every submit.

### Fix
Either wire `verse_today` up in the route handler (if community writes are planned there), or remove it from the request body.

---

## Issue #7 — Duplicate auth routes (`preregister-lookup` vs `auth/login`)

**Impact:** Low | **Effort:** Medium

### Problem
`/api/preregister-lookup` and `/api/auth/login` are functionally identical — both normalize the phone number, optionally handle ranting, and call `lookupPreregisteredName` from Sheets. Maintaining two routes creates a risk of logic drift.

### Fix
Have one route delegate to the other, or consolidate into a single canonical route and redirect/alias the other.

---

## Issue #8 — No server-side cache for schedule reads in `verse-community-full`

**Impact:** Medium | **Effort:** Medium

### Problem
`getScheduleWindow` is called directly as a server-side lib function inside `verse-community-full`, bypassing any HTTP cache. There is no in-memory or Next.js `unstable_cache` layer, so repeated requests within a short window all hit Google Sheets.

### Fix
Wrap `getScheduleWindow` with Next.js `unstable_cache` (or a simple in-process TTL map) keyed on `startDate + windowSize`, with a TTL of ~5 minutes.

---

## Issue #9 — Unnecessary `typeof window !== "undefined"` guard inside `useEffect`

**Impact:** Minor | **Effort:** Trivial

### Problem
In `VerseQuestHome`, a `useEffect` callback has an explicit `typeof window !== "undefined"` guard before reading `localStorage`. Since `useEffect` only runs in the browser, this check is always `true` and adds noise.

```ts
// components/VerseQuestHome.tsx
useEffect(() => {
  if (typeof window !== "undefined") { // ← unnecessary
    setDevotionRead(localStorage.getItem(devotionKey) === "read");
  }
  ...
```

### Fix
Remove the guard; call `localStorage.getItem` directly inside the `useEffect`.

---

## Issue #10 — `readAdminPhone` in `BottomNav` is not memoized

**Impact:** Minor | **Effort:** Trivial

### Problem
`readAdminPhone` is declared as a plain function inside the `BottomNav` component body. It is referenced in `addEventListener` calls inside a `useEffect` with an empty dependency array, but because it's re-created on every render the lint rule is suppressed with `eslint-disable-next-line react-hooks/exhaustive-deps`. This is a code smell.

### Fix
Wrap `readAdminPhone` in `useCallback` with an empty dependency array so it is stable across renders and the ESLint suppression comment can be removed.
