# PRD-006 · Design System 2.0 & Navigation Revamp

**Status:** Draft  
**Area:** tokens.css, BottomNav, Header, glyphs.jsx, global layout  
**Baseline:** `UI.1.0/versequest-redesign-1.0/tokens.css`, `components.jsx`

---

## Problem

The current design system is solid but shows its prototype origins: the colour palette is exclusively purple with little warmth; the bottom navigation bar occupies 68px of precious screen space with no visual elegance; the glyph library has 19 icons but several are semantically misused (GFlame as streak + GFlame reappropriated for Gema in PRD-003, GClock as note indicator in PRD-005). Dark mode is a manual tweak rather than a system-level preference. Typography is consistent but there's no hierarchy for the new screens introduced in PRD-001 through PRD-005.

Specific problems:
- **Single-hue palette:** All backgrounds, borders, and accents are purple derivatives — the UI reads "brand-heavy" rather than "warm faith community."
- **Navigation bar:** 68px glassmorphic bar with 4 equal-weight text+icon items — the active item is a colour change only; no spatial anchor.
- **Dark mode:** Toggled via `tweaks.dark` — there's no system preference listener.
- **Icon conflicts:** 7 icons need new semantic assignments or additions across PRD-003–005.
- **No spacing scale document:** `--space-page-x: 20px` is the only named spacing token; all other padding is hardcoded.
- **Paper grain overlay:** `vq-grain` pseudo-element is always visible — in dark mode it reads as noise rather than texture.

---

## Goals

1. Expand the colour palette with a warm neutral layer and a gold accent.
2. Redesign bottom navigation as a **floating island** with a spatial active indicator.
3. Auto-detect system dark mode preference; retain manual override.
4. Add 8 new glyphs and document the full icon semantic map.
5. Define a complete spacing scale.
6. Conditionally suppress paper grain in dark/sepia modes.

---

## Non-Goals

- Font family change — Plus Jakarta Sans is retained.
- Changing the overall visual language (geometric, minimal, tilted accents) — design language stays.
- Responsive breakpoints beyond 390px — still mobile-only.

---

## Token Changes

### 6.1 — Colour Palette

**Additions to Light Mode:**

```css
/* Warm neutral layer */
--color-bg-warm:        #FEFCF7;   /* page bg alternative, barely yellow */
--color-bg-warm-card:   #FFFDF5;   /* card surface on warm bg */
--color-border-warm:    #EDE8D8;   /* border in warm context */
--color-text-warm:      #4A3F2F;   /* text on warm bg */

/* Gold accent (celebration, coordinator, answered states) */
--color-gold:           #D97706;   /* amber-700 */
--color-gold-light:     #FEF3C7;   /* amber-100 bg */
--color-gold-border:    #FCD34D;   /* amber-300 border */
--color-gold-text:      #92400E;   /* amber-800 text on gold bg */
```

**Changes to Existing Tokens:**

| Token | Old | New | Reason |
|-------|-----|-----|--------|
| `--color-bg-page` | `#F8F7FF` | `#FAFAF8` | Reduced purple tint; warmer neutral |
| `--color-bg-muted` | `#F3F0FF` | `#F5F3FF` | Slightly less saturated |
| `--color-text-body` | `#2D2052` | `#2A1F4E` | Same hue, slightly darker for better contrast |
| `--color-success` | `#22C55E` | `#16A34A` | Green-600 for WCAG AA on white |
| `--color-success-bg` | `rgba(34,197,94,0.1)` | `#F0FDF4` | Consistent with Tailwind semantic |
| `--color-danger` | `#EF4444` | `#DC2626` | Red-600, same contrast improvement |

**Dark Mode additions:**

```css
[data-theme="dark"] {
  --color-bg-warm:       #131210;
  --color-bg-warm-card:  #1C1A16;
  --color-border-warm:   #2E2A22;
  --color-text-warm:     #D6CFBF;
  --color-gold:          #FBBF24;   /* amber-400 — brighter in dark */
  --color-gold-light:    #1C1500;
  --color-gold-border:   #78350F;
  --color-gold-text:     #FDE68A;
}
```

---

### 6.2 — Spacing Scale

Full named spacing scale added to `tokens.css`:

```css
--space-1:   4px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   20px;    /* = current --space-page-x */
--space-6:   24px;
--space-8:   32px;
--space-10:  40px;
--space-12:  48px;
--space-16:  64px;

--space-page-x:   var(--space-5);  /* unchanged alias */
--space-section:  var(--space-4);  /* between section blocks */
--space-card-p:   var(--space-4);  /* internal card padding */
--space-row-gap:  var(--space-3);  /* gap between list rows */
```

All existing hardcoded `padding: 16px` etc. in components should be migrated to scale tokens over time — not required in this cycle, but new components from PRD-001–005 must use the scale.

---

### 6.3 — Paper Grain

**Current:** `vq-grain` pseudo-element is always rendered at `opacity: 0.5`.

**New behaviour:**
- Light mode: `opacity: 0.4` (slightly reduced — was slightly too heavy on the warm neutral bg).
- Dark mode: `opacity: 0.18` (subtle, not noisy).
- Sepia mode (PRD-004): `opacity: 0.55` (grain enhances the paper feel intentionally).

Implementation:

```css
.vq-grain { opacity: 0.4; }
[data-theme="dark"]  .vq-grain { opacity: 0.18; }
[data-theme="sepia"] .vq-grain { opacity: 0.55; }
```

---

## Navigation Redesign

### 6.4 — Floating Island Bottom Nav

Replace the full-width glassmorphic bar with a centered floating pill.

**Design spec:**

```
         ╭───────────────────────────────────╮
         │  🏠  👥  🙏  ✓               │
         ╰───────────────────────────────────╯
               ↑ active pill highlight
```

- Container: `width: fit-content`, `max-width: 340px`, centered horizontally.
- `position: fixed`, `bottom: 20px`, `left: 50%`, `transform: translateX(-50%)`.
- Background: `var(--color-bg-card)`, `border-radius: 999px`, `padding: 10px 16px`.
- Shadow: `0 8px 32px rgba(83,74,183,0.18), 0 2px 8px rgba(0,0,0,0.08)`.
- Border: `1px solid var(--color-border)`.

**Active indicator:**
- A pill-shaped background behind the active tab item (not just colour change).
- `background: var(--color-primary-soft)`, `border-radius: 999px`, `padding: 8px 14px`.
- Animated: slides horizontally between tabs via `left` position + `transition: left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)`.
- Active icon: `var(--color-primary)`, slightly larger (24px vs 22px).
- Inactive icons: `var(--color-text-muted)`, 20px.

**Label behaviour:**
- Labels hidden by default (icon only).
- Active tab label appears below the active icon with a fade-in (`opacity: 0 → 1`, 0.15s).
- This gives the island more breathing room while still labelling the current location.

**Coordinator tab badge:**
- Red dot (8px) positioned top-right of the Absensi icon.
- When island is active on Absensi, badge remains visible.

**Content scroll clearance:**
- All scrollable areas: `padding-bottom: var(--space-12)` (48px) + 20px island height = 68px total. Same as current.

---

### 6.5 — Header Revamp

**Current:** Sticky card with title, subtitle, optional back button, trailing element.

**Issues:** The header `background` is hardcoded to `var(--color-bg-card)`. On the warm-palette screens (Devotional, Library), this clashes with the article's `#FAFAF8` background.

**New:**
- `Header` accepts a `variant` prop: `"default"` | `"transparent"` | `"warm"`.
  - `default` (existing): card bg + border.
  - `transparent`: no background, no border — for screens that scroll behind the header (Devotional article in read mode).
  - `warm`: `var(--color-bg-warm-card)` bg + `var(--color-border-warm)` border.
- Transparent variant: body content scrolls behind, header fades to card bg on scroll (scroll listener adds `is-scrolled` class → `background` transitions from transparent to card bg over 8px of scroll).

---

## Glyph Library Additions

### 6.6 — New Icons

| Name | Shape | Semantic use |
|------|-------|-------------|
| `GShare` | Upward arrow from box | Share sheet trigger (PRD-004) |
| `GNote` | Rectangle with lines | Coordinator notes (PRD-005) |
| `GPin` | Thumbtack shape | Pinned prayer/verse (PRD-003) |
| `GEcho` | Radiating arcs | "Gema" reaction (PRD-003) |
| `GArchive` | Box with down arrow | Perpustakaan / Library (PRD-004) |
| `GBell` | Bell silhouette | Reminder / notification |
| `GFilter` | Funnel | Category filter clear button |
| `GHighlight` | Marker with underline | Highlight mode in reader |

All new glyphs follow existing conventions: `size`, `color`, `stroke`, `filled` props; 24×24 viewBox; geometric / minimal style.

### 6.7 — Semantic Icon Map (resolved conflicts)

| Icon | Canonical Meaning | Do Not Use For |
|------|------------------|----------------|
| `GFlame` | Streak counter | Community Gema reaction |
| `GEcho` | Gema / echo reaction | ← New; use this instead |
| `GHeart` | Generic like | Prayer Amin |
| `GHands` | Prayer Amin | ← Use this; not GHeart |
| `GClock` | Timestamp / time | Coordinator notes |
| `GNote` | Coordinator notes | ← New; use this instead |
| `GBoltSmall` | Reader settings toggle | Quick actions elsewhere |
| `GSparkle` | Prayer answered (legacy) | Deprecated — replace with `GCheckCircle` |

---

## Dark Mode Auto-Detection

### 6.8 — System Preference Listener

**Current:** Dark mode is set by `tweaks.dark` boolean, applied as `data-theme="dark"` on `.vq-app`.

**New:** On app mount:

```javascript
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const userPref = localStorage.getItem('vq_theme'); // 'dark' | 'light' | null

// Resolution order: user override > system > default (light)
const resolved = userPref ?? (mq.matches ? 'dark' : 'light');
document.querySelector('.vq-app').dataset.theme = resolved;

mq.addEventListener('change', (e) => {
  if (!localStorage.getItem('vq_theme')) { // only if no user override
    document.querySelector('.vq-app').dataset.theme = e.matches ? 'dark' : 'light';
  }
});
```

Manual override from the Reader Settings panel (PRD-004) or a future Profile screen writes to `localStorage.vq_theme`.

---

## Component Changes

| Component | Action | Notes |
|-----------|--------|-------|
| `tokens.css` | Extend | New colour tokens, spacing scale, grain adjustments |
| `BottomNav` | Revamp | Floating island, animated active pill, icon-first labels |
| `Header` | Extend | `variant` prop, transparent + warm variants, scroll listener |
| `glyphs.jsx` | Extend | 8 new icons, semantic map documented in comments |
| `App` (root) | Update | System dark mode listener on mount |

---

## Rollout Order

These changes underpin all other PRDs. Recommended implementation sequence:

1. **Token additions** (backward-compatible, no breakage).
2. **Spacing scale** (can be applied progressively to new components only).
3. **System dark mode** (self-contained JS change).
4. **Glyph additions** (additive, no removals yet).
5. **Header variants** (add prop; default behaviour unchanged).
6. **BottomNav island** (visual breaking change — do last, test on all screens).

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Dark mode adoption rate | >40% of users (system auto-detect covers this passively) |
| Navigation tap accuracy (island vs bar) | Maintain >95% (island shrinks tap area, monitor) |
| Perceived loading feel (grain in dark mode) | No negative qualitative feedback in user test |
| Icon legibility (new glyphs) | >90% recognition in 5-second naming test |

---

## Open Questions

1. Does the floating island nav have enough tap target area on smaller phones (SE, 375px width)? May need to set `max-width: calc(100% - 40px)` floor.
2. Should the transparent header variant apply to PrayerWall as well, to give prayer cards more visual presence?
3. GSparkle deprecation: when does it get removed? Needs a migration plan for existing "Doa Terjawab" usage.
