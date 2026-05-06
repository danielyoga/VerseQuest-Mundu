# PRD-004 · Devotional Reader Revamp

**Status:** Draft  
**Area:** DevotionalScreen, ReadingCard (deep-read mode)  
**Baseline:** `UI.1.0/versequest-redesign-1.0/screens.jsx` — `DevotionalScreen`

---

## Problem

The devotional reader is a pleasant but passive experience: scroll, read, tap "Tandai sudah dibaca," navigate back. There is no way to highlight a sentence that struck you, add a personal note, save past devotionals, or share the content with another person. The sticky footer CTA is the only interactive element. Users who want to reflect deeper have no affordance for it inside the app.

Specific problems:
- No highlight / annotation system — reflective readers have no digital pen.
- No bookmarking — past devotionals are inaccessible once the day rolls over.
- No share — inspirational content is locked inside the app.
- "Refleksi" question at the bottom is purely decorative — there is no way to answer it.
- Reading progress is binary (done / not done) with no nuance.
- Typography is fixed; no font-size control for accessibility.

---

## Goals

1. Add inline text highlighting with 3 colour options.
2. Add personal reflection notes anchored to any paragraph or the refleksi question.
3. Build a "Perpustakaan" (Library) archive of past devotionals accessible from the reader.
4. Add native share for the blockquote verse and the devotional title.
5. Add font-size control (3 presets: Kecil, Sedang, Besar).
6. Allow the refleksi question to be answered with a typed note that's saved to the library entry.

---

## Non-Goals

- Audio narration — requires content production pipeline; out of scope.
- Public sharing of personal notes — notes are private only.
- Real-time collaborative annotation — single-user feature only.
- Full Bible integration or cross-references — would require a Bible API.

---

## Screens & States

### 4.1 — Reader Header (revised)

**Current:** Back button, "Renungan Pagi" title, date subtitle.

**New additions:**
- Top-right action cluster (2 icon buttons):
  - `GBoltSmall` → toggle Reader Settings panel (font size, theme).
  - Share icon (new glyph: `GShare`) → share sheet for devotional title + URL.
- Back button unchanged.

---

### 4.2 — Body: Highlights & Annotations

**Highlight gesture:**
- Long-press any paragraph (400ms threshold) → text selection mode activates.
- Selection toolbar appears above selection: three colour swatches + "Catat" (add note) + ✕.
  - Colour 1: `#FDE68A` (warm yellow)
  - Colour 2: `#BBF7D0` (soft green)
  - Colour 3: `#C4B5FD` (lavender, matches brand)
- Tapping a colour applies `<mark>` styling to the selection; toolbar dismisses.
- Tapping "Catat" opens a note input sheet (see 4.3).

**Visual state:**
- Highlighted text: `background-color` set to the chosen colour, slightly translucent (80%).
- In dark mode, highlights are desaturated to avoid neon bleed:
  - Yellow → `#92400E` (dark amber)
  - Green → `#14532D` (dark green)
  - Lavender → `#4C1D95` (dark purple)
- Tapping an existing highlight: show a small tooltip — "Hapus highlight" + note snippet if one exists.

**Highlight persistence:** Stored in `localStorage` keyed by `devotional_date` + paragraph index + char offsets.

---

### 4.3 — Note Sheet

Triggered by tapping "Catat" in the selection toolbar, or tapping "Jawab" on the Refleksi block.

```
┌─────────────────────────────────────────────┐
│  ╌╌╌╌  (sheet handle)                       │
│  Catatanmu                                  │
│  ─────────────────────────────────────────  │
│  [Highlighted text snippet in grey box]     │
│                                             │
│  [Textarea: "Tulis refleksimu..."]          │
│                                             │
│  [Simpan]                    [Batalkan]     │
└─────────────────────────────────────────────┘
```

- Textarea: max 1000 chars, no counter shown unless > 800.
- "Simpan" saves to `localStorage` and closes sheet.
- Saved note shows a small pencil indicator (4px dot) below the highlighted span in the reader.
- Tapping the dot re-opens the note sheet in edit mode.

---

### 4.4 — Refleksi Block (revised)

**Current:** Static question box at the bottom.

**New:**
```
┌──────────────────────────────────────────┐
│  Refleksi                                │
│  ──────────────────────────────────────  │
│  Question text...                        │
│                                          │
│  [+ Jawab]  ← if no note saved           │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│  Your note text (if saved)              │
│  [Edit · 2h lalu]                        │
└──────────────────────────────────────────┘
```

- "+ Jawab" button opens NoteSheet pre-anchored to the refleksi question.
- Once answered, the note appears inline; date of last edit shown in muted text.

---

### 4.5 — Reader Settings Panel

Slide-down panel (from header area, 240px height):

```
Ukuran Teks:    [A-]  [A]  [A+]
Tampilan:       [Terang]  [Gelap]  [Sepia]
```

- **Font sizes:** 14px (Kecil) / 16px (Sedang, default) / 18px (Besar). Applied as `data-fontsize` on the article element.
- **Sepia theme:** New CSS theme variant `[data-theme="sepia"]` with warm parchment tones:
  - Background: `#FDF6E3`
  - Text: `#3B2F2F`
  - Primary: `#8B6914`
- Settings persisted to `localStorage.vq_reader_prefs`.

---

### 4.6 — Perpustakaan (Library Archive)

**Entry point:** New "Arsip" icon button in the Reader header (right of settings button), or reachable via Profile > "Renungan Tersimpan" (PRD-006).

**Library screen:**

```
Header: "Perpustakaan Renungan"   [← Back]

[Search bar]

─── Mei 2026 ─────────────────────────
  ┌─────────────────────────────────┐
  │ 5 Mei · Mazmur 23:1            │
  │ "Tuhan, gembala yang tidak..." │
  │ 2 highlights · 1 catatan       │
  └─────────────────────────────────┘
  ┌─────────────────────────────────┐
  │ 4 Mei · Roma 8:28              │
  │ ...                             │
  └─────────────────────────────────┘
```

- Entries grouped by month.
- Tapping an entry opens the full devotional in read-only mode with highlights and notes restored.
- Read-only mode: no "Tandai sudah dibaca" footer (already done); show date badge instead.
- Library data sourced from `localStorage`; entries without highlights or notes are still listed if the user marked them done.

---

### 4.7 — Share Devotional

Tapping the share icon in the header:

- Options sheet with two choices:
  1. **Bagikan Ayat** — shares the blockquote verse text + reference as plain text.
  2. **Bagikan Renungan** — shares the title + a short excerpt + app link.
- Uses `navigator.share` (native sheet). Clipboard fallback with toast.

---

## Component Changes

| Component | Action | Notes |
|-----------|--------|-------|
| `DevotionalScreen` | Revamp | Header actions, body highlights, refleksi answer |
| New: `NoteSheet` | Add | Reusable for paragraph notes + refleksi |
| New: `HighlightToolbar` | Add | Colour swatches, dismiss, note trigger |
| New: `ReaderSettingsPanel` | Add | Font size, theme switcher |
| New: `LibraryScreen` | Add | Archive of past devotionals |
| New: `LibraryCard` | Add | Summary card with highlight/note count |
| `Header` | Extend | Support 2-icon trailing cluster |

---

## Design Tokens

- **Highlight yellow (light):** `#FDE68A` bg, `rgba(0,0,0,0.05)` border.
- **Highlight green (light):** `#BBF7D0` bg.
- **Highlight lavender (light):** `#C4B5FD` bg.
- **Note indicator dot:** 6px circle, `var(--color-primary)`, positioned bottom-left of highlighted span.
- **Sepia bg:** `#FDF6E3`, text `#3B2F2F`, primary `#8B6914`.
- **Settings panel shadow:** `0 8px 24px rgba(0,0,0,0.12)`.
- **Font size transition:** `font-size 0.15s ease` on `article` element.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Devotional completion rate ("Tandai dibaca" tap) | +15% vs baseline |
| Highlight usage (at least 1 highlight per session) | >25% of read sessions |
| Refleksi answered rate | >30% of completed readings |
| Library return visits | >20% of users open library at least once per week |

---

## Open Questions

1. Should notes sync to the server for cross-device access, or remain local-only?
2. Is Sepia mode worth the CSS overhead, or should we offer light/dark only?
3. Should the library be a top-level nav item or nested under a future Profile screen?
