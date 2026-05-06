# VerseQuest UI 2.0 — PRD Index

PRDs for the revamp of `UI.1.0/versequest-redesign-1.0`. Each document is self-contained and can be executed independently, but the dependency order below is recommended.

---

## Documents

| # | Title | Area | Status | Depends On |
|---|-------|------|--------|------------|
| [PRD-001](./PRD-001-onboarding-auth.md) | Onboarding & Authentication | SignInScreen, first-run flow | Draft | — |
| [PRD-002](./PRD-002-home-dashboard.md) | Home Dashboard | HomeScreen, StreakHero, QuestCard, ReadingCard | Draft | PRD-006 |
| [PRD-003](./PRD-003-prayer-community.md) | Prayer Wall & Community | PrayerWall, CommunityScreen, CreatePrayerModal | Draft | PRD-006 |
| [PRD-004](./PRD-004-devotional-reader.md) | Devotional Reader | DevotionalScreen, Library | Draft | PRD-006 |
| [PRD-005](./PRD-005-coordinator-tools.md) | Coordinator Tools | CoordinatorScreen, WhatsApp integration | Draft | PRD-006 |
| [PRD-006](./PRD-006-design-system-nav.md) | Design System 2.0 & Navigation | tokens.css, BottomNav, Header, glyphs | Draft | — |

---

## Recommended Implementation Order

```
PRD-006 (foundation)
   ├── PRD-001 (auth — unblocks all screens)
   ├── PRD-002 (home — highest user impact)
   ├── PRD-003 (community — social layer)
   ├── PRD-004 (devotional — depth feature)
   └── PRD-005 (coordinator — role-specific)
```

---

## Scope Summary

| PRD | New Screens | Revised Components | New Components |
|-----|-------------|-------------------|----------------|
| 001 | 3 (Onboarding, OTP, Ranting Picker) | SignInScreen | OnboardingSlider, OTPInput, RantingCard |
| 002 | 0 | HomeScreen, QuestCard, ReadingCard, StreakHero | DailyRing, CelebrationBanner, ConfirmSheet |
| 003 | 1 (KomunitasScreen) | PrayerWall, CommunityScreen, CreatePrayerModal | SubTabBar, CategoryFilter, ShareVerseModal |
| 004 | 1 (LibraryScreen) | DevotionalScreen, Header | NoteSheet, HighlightToolbar, ReaderSettingsPanel, LibraryCard |
| 005 | 0 | CoordinatorScreen | MemberCard, HeatmapDots, GroupReminderSheet, WeeklySummarySheet |
| 006 | 0 | BottomNav, Header, tokens.css, glyphs.jsx | — (8 new glyphs) |

---

## Design Principles (Unchanged)

These carry forward from `UI.1.0` — PRDs must not contradict them.

1. **Kindness-first language** — Warm, encouraging, Indonesian Bahasa.
2. **Geometric + minimal** — No emoji in UI chrome; custom SVG glyphs only.
3. **Community-centred** — Social proof, shared progress, coordinator visibility.
4. **Mobile-first, 390px** — Touch-friendly, no hover-only affordances.
5. **Dark mode parity** — Every new token and component must have a dark mode state.
