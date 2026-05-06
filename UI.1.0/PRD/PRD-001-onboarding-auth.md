# PRD-001 · Onboarding & Authentication Revamp

**Status:** Draft  
**Area:** Sign-In, First-run Experience  
**Baseline:** `UI.1.0/versequest-redesign-1.0/screens.jsx` — `SignInScreen`

---

## Problem

The current sign-in flow is a single screen: enter phone number, tap "Masuk," done. There is no first-run experience, no profile completion step, and no way for a new member to understand what VerseQuest is before committing. Users who are handed the app for the first time have no context.

Authentication is intentionally simple — the coordinator controls who is registered, and the phone number acts as the identity token. OTP is out of scope.

Pain points:
- New members skip onboarding and land cold on the home dashboard with no orientation.
- No ranting (branch) selection — `ME.ranting` is hardcoded. Members who transfer branches are stuck.
- Sign-out navigates back to `SignInScreen` but preserves no remembered state, forcing full re-entry.
- No feedback when the phone number is not in the registry — the button just loads and succeeds anyway.

---

## Goals

2. Show a clear error when the phone number is not in the registry (no silent success).
3. Allow ranting selection when the number is registered to multiple branches.
4. Persist phone + ranting in local storage so returning users skip sign-in.
5. Give coordinators a distinct post-login landing (coordinator dashboard, not home).

---

## Non-Goals

- OTP / SMS / WhatsApp verification — no OTP flow exists; phone number is the identity token.
- Social login (Google, Apple) — out of scope.
- In-app member registration — coordinators register members outside the app.
- Push notification permission prompting — handled separately (PRD-005).

---

## Screens & Flows

### 1.1 — Welcome Splash (first run only)

Three paginated cards, swipeable, skip button top-right.

| Slide | Headline | Subtext | Illustration |
|-------|----------|---------|--------------|
| 1 | "Satu ayat setiap pagi." | Mulai harimu dengan firman yang hidup. | StreakHero arc, flame icon |
| 2 | "Berdoa bersama komunitas." | Kiriman doa dari ranting yang saling menguatkan. | PrayerWall card snippet |
| 3 | "Pantau perjalanan imanmu." | Streak, misi harian, dan renungan pagi. | Progress ring + quest icons |

**Entry trigger:** `localStorage.getItem('vq_onboarded')` is null.  
**Exit:** "Mulai" button on slide 3, or skip — both set `vq_onboarded = true` and push to Sign-In.

---

### 1.2 — Phone Entry

Identical layout to current `SignInScreen` with these changes:

- After tapping "Masuk", call `POST /auth/login` with `{ phone }`.
- **Error state (number not found):** Inline message below the input — *"Nomor ini belum terdaftar. Hubungi koordinatormu."* Input border turns `var(--color-danger)`. Button resets to idle. No navigation.
- **Loading state:** Button shows spinner, input disabled.
- **Success:** Navigate to 1.3 (ranting picker) or Home, depending on API response.

---

### 1.3 — Ranting Confirmation (conditional)

Shown only if the API returns `multipleRantings: true`.

- Heading: "Kamu terdaftar di beberapa ranting."
- List of `RantingCard` items (name, coordinator name, member count).
- Tap one → set active ranting → navigate to Home.
- Single-ranting users skip this screen entirely.

---

### 1.4 — Returning User Fast-Login

If `localStorage` has `vq_phone` and `vq_session_token`:

- Show a minimal screen: user avatar initials, name, ranting chip, "Lanjutkan sebagai Yoga" button.
- "Ganti akun" link clears storage and goes to phone entry.

No OTP re-entry needed unless token is expired (server returns 401).

---

## Component Changes

| Component | Change |
|-----------|--------|
| `SignInScreen` | Split into `PhoneScreen` + `RantingPickerScreen`; add error state |
| New: `OnboardingSlider` | Paginated slides, dot indicator, swipe gesture |
| New: `RantingCard` | Selection card with name, coordinator, count |
| `BottomNav` | Hidden on all auth screens + onboarding |

---

## Design Tokens & Visual Notes

- Phone input error state: `var(--color-danger)` border + `shake` keyframe (3 cycles, 4px translate, 0.4s).
- Error message: 12px, `var(--color-danger)`, appears below input with a fade-in.
- Onboarding dots: 6px circles, filled primary for active, muted for inactive. Active dot expands to 18px wide pill on transition.
- Slide illustrations reuse existing glyphs scaled to 64px inside a `var(--color-primary-soft)` circle.

---

## Success Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Sign-in completion rate | Unknown (no tracking) | >90% of attempts |
| OTP error rate | N/A | <15% per session |
| Time to first quest action (new user) | Unknown | <60s from app open |

---

## Open Questions

1. What does the login API return on success — a session token, a cookie, or just a user object? This determines how returning-user fast-login works.
2. Session lifetime — 7 days? 30 days? Until explicit sign-out?
3. Should coordinators see a different post-login default tab (Absensi instead of Home)?
