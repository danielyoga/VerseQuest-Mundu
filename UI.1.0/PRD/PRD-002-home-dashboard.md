# PRD-002 · Home Dashboard Revamp

**Status:** Draft  
**Area:** HomeScreen, StreakHero, QuestCard, ReadingCard  
**Baseline:** `UI.1.0/versequest-redesign-1.0/screens.jsx` — `HomeScreen`, `components.jsx`

---

## Problem

The home screen is a vertical scroll of independent cards with no visual narrative — quests feel like a checkbox list, not a daily journey. The StreakHero is decorative but disconnected from quest progress. The order toggle (`quests_first` / `reading_first`) exists as a developer tweak but has no in-app surface. The reading card is buried under quests by default, even though submitting a verse is the primary action gating three other quests.

Pain points:
- Streak number is prominent but the relation between streak and today's quest state is unclear.
- `QuestCard` for "Apakah saya sudah melakukan Firman hari ini?" is an immediate-complete toggle with no friction — it looks like a real task but acts like a ghost button.
- No delight state: completing all 4 quests looks identical to completing 0.
- `ReadingCard` scroll limit (240px) cuts off the passage for chapters longer than Mazmur 23.
- No greeting personalisation beyond the hardcoded name — day of week, streak context are unused.

---

## Goals

1. Establish a clear visual hierarchy: today's progress first, then actions.
2. Make verse submission the most prominent and rewarding action.
3. Surface day-specific context in the greeting (streak milestone, day of week encouragement).
4. Add a completion celebration state when all 4 quests are done.
5. Make the reading passage fully readable without a scroll trap.
6. Remove the developer-only `dashboardOrder` tweak; make order fixed and deliberate.

---

## Non-Goals

- Persistent notes or highlights within the reading (PRD-004).
- Push notification scheduling from home (PRD-005).
- Streak history / calendar view — separate screen, not this cycle.

---

## Screens & States

### 2.1 — Header & Greeting

**Current:** Static "Selamat pagi, Yoga." + hardcoded date subtitle.

**New:**
- Date string is dynamic: `new Date()` formatted in `id-ID` locale.
- Greeting changes by time of day:
  - 05:00–11:59 → "Selamat pagi"
  - 12:00–17:59 → "Selamat siang"
  - 18:00–23:59 → "Selamat malam"
- Below greeting, a single context line driven by state:
  - 0/4 done, streak > 0 → *"Streak {n} hari. Jangan putus hari ini."*
  - 0/4 done, streak = 0 → *"Hari baru. Mulai dari satu ayat."*
  - 1–3/4 done → *"Sudah {n} dari 4 misi. Hampir selesai!"*
  - 4/4 done → *"Hari ini selesai. Luar biasa, {name}."*

---

### 2.2 — Progress Ring (replaces StreakHero)

Replace the three StreakHero variants with one unified **DailyRing** component.

**Layout:** Centered card, 160px ring (SVG `stroke-dashoffset` animation).

- Outer ring: quest progress (0–4 filled segments, gap between each segment).
- Center: streak number + flame icon below it.
- Below ring: 7-day week strip (Mon–Sun), today's dot highlighted.

**States:**
- Empty (0/4): Ring is muted gray, flame is gray, center text is `--color-text-muted`.
- In-progress (1–3/4): Ring fills segment by segment in `--color-primary`, flame pulses.
- Complete (4/4): Ring becomes gold (`#F59E0B`), flame is gold, confetti burst (CSS keyframe, 40 particles, 1.2s).

**Removed:** `tweaks.streakStyle` variants (arc, minimal). The ring is the single canonical component.

---

### 2.3 — Quest Section

**Layout change:** Replace flat vertical stack with a grouped card containing all 4 quests.

```
┌─────────────────────────────────┐
│  Misi Hari Ini          2 / 4   │
│  ────────────────────────────── │
│  ✦  Submit Firman          [→]  │  ← PRIMARY quest (larger row)
│  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─ │
│  ✓  Renungan Pagi        [done] │
│  □  Checklist Firman       [→]  │
│  □  3 Hal Bersyukur        [→]  │
└─────────────────────────────────┘
```

- **Submit Firman** row is visually primary: 48px height, bold title, subtitle, chevron.
- Other rows: 40px, title only, status badge or chevron.
- Done rows: title has strikethrough, row opacity 0.6, check icon replaces chevron.
- Tapping the entire row triggers the action (not just a CTA button).

**"Checklist Firman" quest:** Replace the instant-complete toggle with a simple confirmation bottom sheet:

```
"Apakah kamu sudah melakukan Firman hari ini?"
[Ya, sudah]   [Belum]
```

Tapping "Ya, sudah" marks it complete. "Belum" closes the sheet without state change.

---

### 2.4 — Reading Section (ReadingCard revamp)

**Problem:** Fixed 240px scroll container cuts off longer passages. Users miss verses.

**New behavior:**
- Reading card is full-height (no max-height cap).
- Passage renders as a flat list, no internal scroll.
- If passage > 12 verses, render first 8 then a "Tampilkan semua ({n} ayat)" text button that expands inline.
- Selected verse shows a persistent highlighted row (soft purple bg, left border) + "Pilih ayat ini" button anchored below the verse row, not below the whole list.
- Already-submitted state: selected verse row stays highlighted, button replaced by "Sudah dipilih ✓" badge. No re-submission possible.

---

### 2.5 — All-Done Celebration State

When `doneQuests === 4`:
- `DailyRing` animates to gold (see 2.2).
- A `CelebrationBanner` fades in below the ring: *"Harimu lengkap. Tuhan menyertaimu!"* with a sparkle icon.
- Banner has a soft gold background (`#FEF3C7`) and collapses after 4 seconds.
- Quest section collapses to a compact summary row: "4 / 4 misi selesai ✓".

---

## Component Changes

| Component | Action | Notes |
|-----------|--------|-------|
| `StreakHero` | Replace | Replaced by `DailyRing` |
| `QuestCard` | Revamp | Grouped card, row-tap targets, confirmation sheet |
| `ReadingCard` | Revamp | No height cap, inline verse selection |
| New: `DailyRing` | Add | SVG ring, 7-day strip, confetti |
| New: `CelebrationBanner` | Add | Gold banner, auto-dismiss |
| New: `ConfirmSheet` | Add | Reusable 2-option bottom sheet |
| `HomeScreen` | Revamp | Fixed layout order, dynamic greeting |

---

## Design Tokens

- **Gold accent:** `#F59E0B` (complete state only — not added to global palette).
- **Ring segment gap:** 6px arc gap between each of the 4 segments.
- **Animation timing:** Ring fill — `0.5s cubic-bezier(0.34, 1.56, 0.64, 1)` (spring).
- **Confetti particles:** 40 `<div>` elements, random hue rotation of `var(--color-primary)`, `transform: translate + rotate` keyframe.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Verse submission rate (day 1) | >70% of sessions |
| All-4-quests completion rate | >40% of active users |
| Reading card scroll abandonment | Reduce by 30% vs baseline |
| Time on Home screen per session | +20s (more reading, not confusion) |

---

## Open Questions

1. Should the `DailyRing` streak count reset to 0 visually at midnight, or show yesterday's streak until the first action today?
2. Should the "3 Hal Bersyukur" quest open a full screen or an inline text area within the quest card?
3. Is the gold celebration color on-brand, or should we keep it within the purple palette (e.g. a brighter `var(--color-primary-light)`)?
