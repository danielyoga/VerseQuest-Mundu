# PRD-003 · Prayer Wall & Community Revamp

**Status:** Draft  
**Area:** PrayerWall, CommunityScreen, CreatePrayerModal  
**Baseline:** `UI.1.0/versequest-redesign-1.0/screens.jsx`

---

## Problem

**Prayer Wall** and **Community** are two separate bottom-nav tabs that serve overlapping social functions: one shows prayer requests, the other shows shared verses. Users switch between them constantly, and neither has enough content density to justify a dedicated tab. The Prayer Wall has no categorisation, no search, and no way to pray for answered requests (they simply disappear). The Community screen is read-only — users can't react to or comment on a shared verse.

Specific problems:

- **Prayer Wall:** All prayers look identical — no visual distinction between urgent, ongoing, and answered states.
- **Prayer Wall:** "Amin" interaction uses `GHeart` but is labeled "Amin" — the icon and label conflict. Tapping "Amin" feels like Instagram "like," not communal prayer.
- **Prayer Wall:** Answered prayers vanish from the list — users lose a record of testimony.
- **Community:** Static verse list with no interaction — no way to say "ayat ini juga berbicara padaku."
- **Both tabs:** Coordinators cannot pin or moderate content.

---

## Goals

1. Merge PrayerWall and Community into a single **"Komunitas"** tab with two sub-sections.
2. Add prayer categories (Pribadi, Keluarga, Kesehatan, Pelayanan, Syukur).
3. Replace heart icon with praying-hands icon for "Amin" to match the semantic intent.
4. Build an **Answered Prayers** archive (collapsible section, preserved testimonies).
5. Add a "Gema" (echo) reaction on Community verses: tap to echo a verse as your own.
6. Allow coordinators to pin one prayer and one community verse per day.

---

## Non-Goals

- Comments / threaded replies — too complex for this cycle; consider PRD-006.
- Image attachments in prayers — no media support yet.
- Real-time updates — polling or websocket deferred to backend milestone.

---

## Screens & Layout

### 3.1 — Unified Komunitas Tab

Single screen, two tabs within the page:

```
Header: "Komunitas"
Sub-tab bar: [Doa Wall]  [Ayat Bersama]
─────────────────────────────────────────
Content area (scrollable, unique per tab)
─────────────────────────────────────────
FAB: + (context-sensitive: add prayer or share verse)
```

Sub-tab bar:
- Pill style, full-width, inside a sticky bar below the header.
- Active pill: `var(--color-primary)` background, white label.
- Inactive: transparent, muted text.
- Tab switch: no page navigation — swap content in place with a 150ms opacity crossfade.

---

### 3.2 — Doa Wall (Prayer Tab)

**Category filter strip** (horizontal scroll, above prayer list):
```
[Semua]  [Pribadi]  [Keluarga]  [Kesehatan]  [Pelayanan]  [Syukur]
```
- Pill chips, same style as sub-tab bar but smaller (12px label, 28px height).
- "Semua" is always first; active filter highlighted.
- Selecting a category filters the list in place.

**Prayer Card (revised):**

```
┌───────────────────────────────────────┐
│  [Pin icon]  [Category chip]          │  ← Pinned cards only
│  [Avatar]  Name · Ranting · 12m ago   │
│                                       │
│  Prayer text here, up to 3 lines      │
│  before "Baca selengkapnya" expand.   │
│                                       │
│  [🙏 Amin · 7]    [Terjawab ✓]       │
└───────────────────────────────────────┘
```

Changes from current:
- **`GHands` replaces `GHeart`** for the Amin button.
- Amin count shows the number; no label change needed (icon carries the meaning).
- Long prayers (>3 lines) truncate with "Baca selengkapnya" inline expand, no modal.
- Category chip appears top-right on each card (small `vq-badge soft`).
- Pinned card: gold left border (`#F59E0B`, 3px), "Disematkan koordinator" label below category chip.

**Answered Prayers Section:**

Below the active prayer list, a collapsible section:

```
[▾ Doa Terjawab (3)]
  ┌─────────────────────────┐
  │ ✦ [Avatar] Name · 3h    │
  │   Prayer text snippet   │
  │   "Puji Tuhan!" added   │
  └─────────────────────────┘
```

- Cards in this section are muted (opacity 0.7), no Amin button.
- If the original prayer had a testimony note (see CreatePrayerModal update), it appears below the original text.
- Section is collapsed by default; "Lihat ({n})" button expands it.

---

### 3.3 — Ayat Bersama (Community Verses Tab)

**Verse Card (revised):**

```
┌───────────────────────────────────────┐
│  "  [Large decorative quote mark]     │
│                                       │
│  Verse text in vq-quote style         │
│                                       │
│  [Book] Chapter:Verse  ·  5 Mei       │
│  shared by Name · Ranting             │
│                                       │
│  [🔥 Gema · 4]    [Bagikan]          │
└───────────────────────────────────────┘
```

**Gema (Echo) interaction:**
- Tap "Gema" → this verse is added to the user's Home reading card as a secondary highlight.
- Gema count increments; if user already echoed, button shows "Di-gema ✓" and decrements on tap.
- Uses `GFlame` icon (reappropriated for enthusiasm, distinct from streak context).

**Bagikan button:**
- Opens native share sheet (`navigator.share`) with pre-filled: verse text + reference + "Dikirim dari VerseQuest".
- Fallback: copies to clipboard with a toast notification.

**Pinned verse (coordinator only):** Same gold left border treatment as prayer wall.

---

### 3.4 — CreatePrayerModal (revised)

New fields added:

1. **Category selector** (required): horizontal pill group inside the modal.
   ```
   [Pribadi]  [Keluarga]  [Kesehatan]  [Pelayanan]  [Syukur]
   ```
   Tap one to select; unselected pills are outlined, selected is filled primary.

2. **Testimony field** (shown only when marking answered):
   - When user taps "Doa Terjawab" → instead of direct confirmation, open a mini sheet:
     ```
     Puji Tuhan! Ceritakan bagaimana doa ini dijawab (opsional):
     [Textarea, max 300 chars]
     [Tandai Terjawab]
     ```
   - Testimony is saved with the prayer and shown in the Answered section.

3. **Anonymous mode:** Existing toggle retained. When anonymous, category chip still shows but name/ranting are hidden.

**Sharing a verse (new modal):**
- FAB on Ayat Bersama tab opens `ShareVerseModal` instead of `CreatePrayerModal`.
- Pre-populated from today's `SCHEDULE.passage` — user picks one verse.
- No text input; verse is selected from the passage list (same UX as `ReadingCard`).
- "Bagikan ke Komunitas" button submits.

---

## Component Changes

| Component | Action | Notes |
|-----------|--------|-------|
| `PrayerWall` | Rename + revamp | Now one sub-tab inside `KomunitasScreen` |
| `CommunityScreen` | Merge into `KomunitasScreen` | Becomes a sub-tab |
| New: `KomunitasScreen` | Add | Hosts sub-tab bar + tab content |
| New: `SubTabBar` | Add | Reusable 2–4 pill tab selector |
| New: `CategoryFilter` | Add | Horizontal scroll chip strip |
| `CreatePrayerModal` | Revamp | Category picker + testimony field |
| New: `ShareVerseModal` | Add | Verse selection from passage, submit to community |
| `BottomNav` | Update | "Prayer" item relabeled "Komunitas", icon `GUsers` |

---

## Design Tokens

- **Gema button active:** `var(--color-primary-soft)` bg, `var(--color-primary)` flame icon.
- **Answered card muting:** `opacity: 0.7`, no hover/active effect.
- **Category chips:** 12px label, 6px 14px padding, `var(--radius-pill)` border, 1px border.
- **Sub-tab bar:** sticky, 48px height, `var(--color-bg-card)` bg, bottom border.
- **Pinned card border:** 3px solid `#F59E0B`, `border-radius: var(--radius-lg)` (all sides).

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Amin interactions per session | +50% vs baseline |
| Prayer answered rate (user-initiated) | >20% of own prayers |
| Community verse reactions ("Gema") | >30% of verse cards tapped at least once |
| Bottom-nav tap distribution | Komunitas tab within 10% of Home tab |

---

## Open Questions

1. Should "Gema" on a community verse also submit it as the user's own Home verse for the day (replacing their current selection), or is it additive?
2. Coordinator pin moderation — is this a long-press on a card or a separate coordinator-only screen?
3. Should answered prayers expire from the archive after 30 days, or persist indefinitely?
