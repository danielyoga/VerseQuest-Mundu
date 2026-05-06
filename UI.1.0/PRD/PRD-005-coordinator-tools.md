# PRD-005 · Coordinator Tools Revamp

**Status:** Draft  
**Area:** CoordinatorScreen (Absensi), WhatsApp integration  
**Baseline:** `UI.1.0/versequest-redesign-1.0/screens.jsx` — `CoordinatorScreen`

---

## Problem

The Coordinator screen is essentially a read-only member list with two counters. Its only action is tapping a WhatsApp icon that doesn't link anywhere (`href="#"`, `e.preventDefault()`). Coordinators — who are responsible for motivating 10–15 members daily — are given a tool that shows them who's missing but gives them no leverage to do anything about it within the app.

Specific problems:
- WhatsApp buttons are placeholders — they don't actually open WA.
- No way to message multiple pending members at once (group reminder).
- No historical data — coordinators can't see trends like "Budi missed 4 of the last 7 days."
- No weekly or monthly summary to share with leadership.
- Coordinator role is a hardcoded `ME.isCoordinator` boolean — there's no way to hand off the role temporarily.
- `MEMBERS_ALL` is static — coordinators can't add, remove, or edit members in-app.

---

## Goals

1. Make WhatsApp buttons functional with pre-filled WA message templates.
2. Add a "Kirim Pengingat Grup" action that generates one group message for all pending members.
3. Show a 7-day attendance heatmap per member.
4. Add a weekly summary card that coordinators can share as an image/text.
5. Allow coordinators to add notes against a member (e.g., "sedang sakit minggu ini").
6. Fix `pendingCount` to be derived from real data, not a tweak slider.

---

## Non-Goals

- In-app member registration / removal — requires backend admin panel.
- Push notification sending from the coordinator screen — handled by backend cron.
- Group chat within the app — WA remains the communication channel.
- Role management (assigning/removing coordinator) — admin-only.

---

## Screens & Flows

### 5.1 — Coordinator Tab Entry

**Current:** 4th bottom nav tab, visible only if `ME.isCoordinator`.

**New:** Tab relabeled "Absensi" with `GCheckCircle` icon. No label change needed.

On mount, `pendingCount` is derived from live `MEMBERS_ALL` data (not a tweak). The tab badge shows the pending count as a red dot notification if `pendingCount > 0`:

```
[Absensi tab icon]
       ●  (red dot, no number, replaces pending count in header)
```

---

### 5.2 — Summary Header (revised)

**Current:** Two stat boxes (Belum Submit / Sudah Submit).

**New:** Three boxes in a row:

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Belum    │  │ Sudah    │  │ Streak   │
│ Submit   │  │ Submit   │  │ Rata²    │
│   5      │  │   8      │  │  11 hr   │
│ (danger) │  │(success) │  │ (muted)  │
└──────────┘  └──────────┘  └──────────┘
```

- **Streak Rata²:** Average streak across all members who have submitted at least once. Displayed as `{n} hr` with `GFlame` icon (16px).
- Tapping any box filters the member list below (e.g., tap "Belum Submit" → filter to not-submitted).
- Active filter: box gets a bottom border in `var(--color-primary)`.

---

### 5.3 — Group Reminder Action

Above the member list, a sticky action bar (below summary, above section labels):

```
[🔔 Kirim Pengingat]   [📊 Ringkasan Minggu]
```

**Kirim Pengingat:**
- Opens a bottom sheet with a pre-composed WhatsApp group message:
  ```
  Halo teman-teman ranting LABU! 🙏
  
  Mengingatkan untuk submit firman hari ini.
  Yang belum: Budi, Citra, Denny, (+2 lagi)
  
  Link: [deep link ke app]
  
  Tuhan memberkati!
  ```
- Coordinator can edit the message before sending.
- "Kirim ke Grup WA" button: opens WhatsApp with `wa.me/?text=` URL-encoded message.
- Pre-fills with first 5 pending member first names; if >5, appends "(+{n} lagi)".

**Ringkasan Minggu:**
- Opens a summary sheet (see 5.5).

---

### 5.4 — Member List (revised)

**Current:** Flat list, avatar + name + WA button.

**New per-member card:**

```
┌───────────────────────────────────────────┐
│  [Avatar]  Budi Santoso        [WA]       │
│            LABU                           │
│  ● ○ ● ● ● ● ○   ← 7-day heatmap dots    │
│  [Note icon]  "Sedang sakit"  ← if note  │
└───────────────────────────────────────────┘
```

**7-day heatmap:**
- 7 dots, left = 6 days ago, right = today.
- Filled `var(--color-primary)`: submitted that day.
- Outlined `var(--color-border)`: missed.
- Filled `var(--color-danger)`: missed 3+ consecutive days (dot color changes to danger).
- Dot size: 10px circles, 4px gap.

**WhatsApp button (functional):**
- Generates `wa.me/{phone}?text=` with a personalized message:
  ```
  Halo {name}! 👋 Mengingatkan untuk submit firman hari ini. Tuhan menyertaimu! 🙏
  ```
- Phone number sourced from `MEMBERS_ALL[n].phone`.
- Opens in new tab / WA app.

**Member note:**
- Long-press on a member card → "Tambah catatan" sheet (single-line text, max 100 chars).
- Note shown below heatmap in muted text.
- Note icon (`GClock` repurposed as note indicator, or new `GNote` glyph) appears if note exists.
- Notes stored in `localStorage.vq_coordinator_notes`.

---

### 5.5 — Weekly Summary Sheet

Triggered by "Ringkasan Minggu" button.

```
┌────────────────────────────────────────┐
│  Ringkasan Minggu · Ranting LABU      │
│  29 Apr – 5 Mei 2026                  │
│                                        │
│  Rata-rata kehadiran: 78%             │
│  Hari terbaik: Rabu (12/13)           │
│  Paling konsisten: Yoga (7/7)         │
│  Perlu perhatian: Citra (2/7)         │
│                                        │
│  [Bagikan sebagai Teks]               │
└────────────────────────────────────────┘
```

- Data is computed from the 7-day heatmap values of all members.
- "Paling konsisten" = member with most submissions this week.
- "Perlu perhatian" = member with fewest submissions (only shown if <50% attendance).
- "Bagikan sebagai Teks" → `navigator.share` with formatted text, or clipboard fallback.

---

### 5.6 — Answered / Done Section (revised)

**Current:** Collapsible "Sudah submit ({n})" list below pending.

**New:** Still collapsible, but cards show the submitted verse reference if available:

```
✓  Yoga  ·  Mazmur 23:1
✓  Andre P.  ·  (ayat tersimpan)
```

- Verse reference sourced from the member's submitted verse (backend data).
- "No verse data" fallback: "(ayat tersimpan)" in muted text.

---

## Component Changes

| Component | Action | Notes |
|-----------|--------|-------|
| `CoordinatorScreen` | Revamp | All sections revised |
| New: `MemberCard` | Add | Avatar, heatmap dots, WA button, note |
| New: `HeatmapDots` | Add | 7-dot attendance visualiser |
| New: `GroupReminderSheet` | Add | Editable WA message composer |
| New: `WeeklySummarySheet` | Add | Stats + share |
| New: `MemberNoteSheet` | Add | Single-field note input |
| `BottomNav` | Update | Red dot badge on Absensi tab |

---

## Design Tokens

- **Heatmap dot filled:** 10px, `var(--color-primary)`, `border-radius: 50%`.
- **Heatmap dot danger:** `var(--color-danger)` fill (3+ consecutive misses).
- **Heatmap dot empty:** 10px, transparent, 1.5px `var(--color-border)` border.
- **Tab badge dot:** 8px red dot (`#EF4444`), `position: absolute`, top-right of tab icon.
- **Summary header boxes:** Equal flex-1, no change to existing danger/success colour treatment; new "Streak" box uses `var(--color-bg-muted)`.

---

## WhatsApp Message Templates

All templates are editable by the coordinator before sending.

| Template | Trigger | Body |
|----------|---------|------|
| Individual reminder | WA button on member card | "Halo {name}! Mengingatkan untuk submit firman hari ini. Tuhan menyertaimu! 🙏" |
| Group reminder | "Kirim Pengingat" | Multi-line with pending names list |
| Weekly summary share | "Ringkasan Minggu" | Formatted stat summary text |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| WA message send rate (vs. button tap) | >60% of taps proceed to WA |
| Group reminder usage | >50% of coordinators use it at least once per week |
| Member submission rate (attributed to coordinator nudge) | +15% on days coordinator uses the tool |
| Weekly summary shares | >3 per coordinator per month |

---

## Open Questions

1. Should the heatmap data come from the server or be reconstructed from local logs? (Local is faster but inaccurate if users switch devices.)
2. Is there a maximum ranting size? The layout assumes 10–15 members; a 30-member ranting would need pagination.
3. Should coordinators be able to submit on behalf of a member (pastoral edge case)?
