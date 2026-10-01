# Handoff: Buah Roh — Prayer page + Amen fruit card

Addendum to VerseQuest v3.3 (Buah Roh Prayer Streak). The chosen design uses the **4c** prayer page ("Lembut netral, fokus") and the **3c** Amen pop-up ("Fajar menyingsing").

## About the design files
`Buah Roh Prayer Final.dc.html` is a **design reference built in HTML**, not production code. It shows the intended look, timing and behaviour. Rebuild it in the VerseQuest codebase (Next.js + Tailwind, existing `app/globals.css` tokens), following the codebase's own patterns. `reference/` contains a framework-light TSX + CSS sketch that matches the prototype 1:1. Use it as a guide for values; don't treat it as a drop-in file.

## Fidelity
**High-fidelity.** Colours, type, spacing and animation timings are final. Match them exactly.

## Design tokens (all from the VerseQuest design system)
| Token | Hex | Used for |
|---|---|---|
| `--vq-bg-2` | #fafafa | Prayer page background; empty day dot fill |
| `--vq-bg` | #ffffff | End colour of the dawn background |
| `--vq-text` | #171717 | Prayer text, fruit name, state text |
| `--vq-muted` | #525252 | Eyebrows, hint, daily line |
| `--vq-muted-2` | #6b7280 | (not used on these screens) |
| `--vq-brand` | #534ab7 | Amen/Tutup buttons, divider lines, verse ref, done dots, chip text |
| `--vq-brand-hover` | #3c3489 | Button hover; start colour of the dawn background |
| `--vq-brand-tint` | #eeedfe | Fruit chip background |
| `--vq-on-brand` | #ffffff | Text on brand buttons |
| `--vq-today` | #fac775 | Today's dot; sun glow (rgba(250,199,117,…)) |
| `--vq-today-ink` | #412402 | Glyph on today's dot |
| `--vq-border-2` | #e5e5e5 | 1px ring around each day dot |

Font: **Geist** (`--font-sans`), weights 400/500/600. The prayer page type is intentionally larger than the base `text-body` (14px) because the audience is 8–70 years old.

## Screen 1: Prayer page (4c)
The shell is 390px wide (`--shell-width`), full height, background `--vq-bg-2`.

- **Container:** flex column, padding `52px 28px 24px` (top 52 includes the status bar; in the app use `max(24px, env(safe-area-inset-top))` + 28px), gap 14px.
- **Header row:** flex, space-between, align-items center, gap 8px.
  - Eyebrow "DOA PAGI": 12px/16px, weight 500, letter-spacing 0.025em, uppercase, `--vq-muted`. The label changes by time of day ("DOA MALAM" in the evening, if the app supports it).
  - Fruit chip `{emoji} {name} • Hari {d}/7`: padding 6px × 12px, radius 9999px, background `--vq-brand-tint`, text `--vq-brand`, 13px/500, `white-space: nowrap`.
- **Prayer block:** flex 1, flex column, centred on both axes, text-align center, gap 20px.
  - Divider: 40 × 2px, radius 2px, `--vq-brand` (one above the text, one below).
  - Prayer text: 24px, line-height 1.6, weight 500, `--vq-text`, `text-wrap: pretty`. Copy comes from the day's prayer content.
  - Hint "Bacalah perlahan, lalu tekan Amen.": 14px/1.625, `--vq-muted`.
- **Amen button:** full width, min-height 56px, radius 16px (`--vq-radius-xl`), background `--vq-brand`, text white 18px/500, label "Amen 🙏". Hover `--vq-brand-hover`. Pressed `transform: scale(0.98)`. No shadow.

## Screen 2: Amen fruit card (3c, "Fajar menyingsing")
A full-screen overlay (`position: fixed; inset: 0`) above the prayer page, `role="dialog" aria-modal="true" aria-labelledby` pointing at the fruit name.

### Layout
- **Background:** animates from `--vq-brand-hover` to `--vq-bg`.
- **Sun:** an absolutely positioned 580 × 580px circle, `left: 50%`, `bottom: -200px`, background `radial-gradient(circle, rgba(250,199,117,.95) 0%, rgba(250,199,117,.45) 35%, rgba(238,237,254,0) 68%)`. It is decorative, so set `aria-hidden`.
- **Content column:** position relative, height 100%, flex column, centred, gap 14px, padding `32px 24px`, text-align center.
  1. Fruit emoji: 54px.
  2. Eyebrow "BUAH ROH HARI INI": 12/16, weight 500, 0.025em, uppercase, `--vq-muted`.
  3. Fruit name: 38px/1.15, weight 500, `--vq-text`, `margin-top: -6px`.
  4. Daily line (one per fruit, see below): 19px/1.5, `--vq-muted`, max-width 300px, `text-wrap: pretty`.
  5. State text: 16px/1.5, `--vq-text`, max-width 300px.
  6. Day dots: a row of 7, gap 8px. Each dot is 26px round, `--vq-bg-2` with a 1px `--vq-border-2` border, and holds an inner fill:
     - done (index < day−1): `--vq-brand` fill, white "✓" 12px/600
     - today (index = day−1): `--vq-today` fill, "🙏" 12px
     - future: transparent
  7. Reference "Galatia 5:22-23": 13px, `--vq-brand`, `font-variant-numeric: tabular-nums`.
  8. "Tutup" button: `margin-top: 8px`, full width, min-height 56, radius 16, `--vq-brand`, white 18/500. Hover and pressed states are the same as the Amen button.

### Animation timeline (all `animation-fill-mode: both`, starting when the overlay mounts)
| # | Element | Keyframe | Delay | Duration | Easing |
|---|---|---|---|---|---|
| 1 | Overlay background | `vqDawn` | 0 | 1300ms | ease-in-out |
| 2 | Sun | `vqSun` | 0 | 1400ms | cubic-bezier(.2,.7,.2,1) |
| 3 | Emoji | `vqRise` | 700ms | 600ms | ease |
| 4 | Eyebrow | `vqFade` | 900ms | 400ms | ease |
| 5 | Fruit name | `vqWrite` | 950ms | 650ms | linear |
| 6 | Daily line | `vqWrite` | 1550ms | 800ms | linear |
| 7 | State text | `vqFade` | 2250ms | 500ms | ease |
| 8 | Dot *i* (0–6) inner fill | `vqPop` | 2350 + i×55 ms | 380ms | ease |
| 9 | Reference | `vqFade` | 2550ms | 400ms | ease |
| 10 | Tutup button | `vqRise` | 2700ms | 450ms | ease |

Total ≈ 3.15s. Keyframes:
```css
@keyframes vqDawn  { 0% { background-color:#3c3489 } 100% { background-color:#ffffff } }
@keyframes vqSun   { 0% { opacity:0; transform:translate(-50%,40%) scale(.5) } 100% { opacity:1; transform:translate(-50%,0) scale(1) } }
@keyframes vqRise  { from { opacity:0; transform:translateY(12px); filter:blur(4px) } to { opacity:1; transform:none; filter:blur(0) } }
@keyframes vqFade  { from { opacity:0 } to { opacity:1 } }
@keyframes vqWrite { from { clip-path:inset(0 100% 0 0) } to { clip-path:inset(0 0 0 0) } }
@keyframes vqPop   { 0% { transform:scale(0) } 70% { transform:scale(1.3) } 100% { transform:scale(1) } }
```
`vqWrite` wipes left to right across the whole block, so a two-line daily line reveals both lines together. That is intended.

**Framer Motion equivalent** (the addendum asks for it): convert each row into `initial` / `animate` / `transition={{ delay: d/1000, duration: dur/1000, ease }}`. Use `clipPath: 'inset(0 100% 0 0)' → 'inset(0 0% 0 0)'` for vqWrite and `backgroundColor` for vqDawn. For vqPop use `scale: [0, 1.3, 1]` with `times: [0, .7, 1]`.

**Reduced motion:** with `prefers-reduced-motion: reduce` (or Framer's `useReducedMotion()`), skip all delays and durations so the final state appears immediately.

## Interactions and behaviour
- **Tap Amen:** call `recordAmen(session.phone, toLocalDateStr(new Date()))` first, then open the card with the result. The chip on the page updates behind the overlay.
- **Card state:** `advanced === true` gives the normal-day card; `advanced === false` (a second Amen on the same day) gives the same-day repeat card. The full animation plays both times.
- **Closing:** the Tutup button, Escape, or the Android back button closes the card without an exit animation (or a 200ms `vqFade` in reverse). Return focus to the Amen button.
- **Focus:** when the card opens, focus the Tutup button after its animation (≈3.15s), or immediately with reduced motion. Lock body scroll while the card is open.
- Tapping the card background does **not** close it; this protects the reveal from accidental taps.

## Copy
| State | State text |
|---|---|
| Normal | `Hari {dayInFruit} dari 7. Terus setia berdoa ya!` |
| Same-day repeat | `Kamu sudah berdoa hari ini. Hari {dayInFruit} dari 7.` |

The completed, reset and cycle states from the addendum were left out of this design round. When they are added, reuse this layout and swap in the addendum's texts.

Daily lines (add a `line` field to `FRUITS` in `lib/fruitsOfSpirit.ts`). These are drafts awaiting the requester's approval:
| # | key | name | emoji | line |
|---|---|---|---|---|
| 1 | gentleness | Kelemahlembutan | 🕊️ | Biarlah kata-katamu hari ini lembut seperti embun pagi. |
| 2 | love | Kasih | ❤️ | Kamu dikasihi Tuhan. Bagikan kasih itu hari ini. |
| 3 | joy | Sukacita | ☀️ | Sukacita dari Tuhan adalah kekuatanmu hari ini. |
| 4 | peace | Damai Sejahtera | 🌿 | Damai-Nya menjaga hati dan pikiranmu. |
| 5 | patience | Kesabaran | 🌱 | Langkah kecil pun berarti. Tuhan sabar menuntunmu. |
| 6 | kindness | Kemurahan | 🤲 | Satu kebaikan kecil hari ini bisa jadi berkat besar. |
| 7 | goodness | Kebaikan | 🍇 | Lakukan yang baik, sebab Tuhan baik kepadamu. |
| 8 | faithfulness | Kesetiaan | 🕯️ | Kesetiaanmu berdoa hari ini sangat berharga. |
| 9 | self-control | Penguasaan Diri | ⛰️ | Tuhan memberimu kekuatan untuk menguasai diri. |

## State management
- UI state: `open: boolean` and `result` (the value returned by `recordAmen`).
- Derived values: `fruit`, `dayInFruit`, and `variant = result.advanced ? 'normal' : 'repeat'`.
- Nothing is fetched and nothing is written to Sheets. All persistence goes through `lib/fruitStreak.ts`, as the addendum specifies.

## Accessibility
- All text meets 4.5:1 contrast on its final background (muted #525252 on #fff ≈ 7.8:1).
- The dots row has `aria-label="Hari {d} dari 7"`, and each dot is `aria-hidden`.
- Tap targets are at least 56px, above `--tap-min` (52px).

## Assets
None. Only native emoji and CSS shapes are used; Geist loads from Google Fonts / `next/font`.

## Files
- `Buah Roh Prayer Final.dc.html`: the final interactive design plus an on-page spec (open in a browser).
- `support.js`: the runtime needed to open the .dc.html file.
- `reference/FruitOfSpiritCard.tsx` and `reference/fruit-card.css`: a reference implementation with the exact values.
