"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import { toLocalDateString } from "@/lib/date-utils";
import { computeLossStreakFromLastSubmit, getMoodEmoji } from "@/lib/moodEmoji";
import {
  computeStreakAfterSubmit,
  getDisplayStreak,
  getWeekDots,
  hasSubmittedToday,
} from "@/lib/streak/streak";
import { getTodayString } from "@/lib/sheetName";
import type { StreakSyncMergedPayload } from "@/lib/streak/sync-merge";
import type { UserStats } from "@/hooks/useUser";
import type { StoredState, VerseSubmission } from "@/types";
import { CURRENT_SCHEMA_VERSION } from "@/types";

/**
 * App data key — stable across deployments. Do not rename or repurpose; new versions
 * only add fields / migrations. Language lives under LOCALE_STORAGE_KEY (separate).
 */
export const APP_DATA_STORAGE_KEY = "versequest_v1";

function emptyState(): StoredState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: { name: "", phone: "" },
    streak_count: 0,
    last_submitted_at: null,
    xp_total: 0,
    submission_dates: [],
  };
}

function parseStored(raw: string): StoredState | null {
  try {
    const parsed = JSON.parse(raw) as StoredState & { profile: { ranting_name?: string } };
    if (!parsed.profile?.name || !parsed.profile?.phone) return null;
    // Migrate legacy `ranting_name` field → `ranting` if present.
    const ranting = parsed.profile.ranting ?? parsed.profile.ranting_name;
    return {
      ...emptyState(),
      ...parsed,
      schemaVersion: parsed.schemaVersion ?? 1,
      profile: {
        name: parsed.profile.name,
        phone: parsed.profile.phone,
        ...(ranting ? { ranting } : {}),
        is_coordinator: parsed.profile.is_coordinator ?? false,
        coordinator_ranting: parsed.profile.coordinator_ranting ?? null,
      },
      submission_dates: Array.isArray(parsed.submission_dates)
        ? parsed.submission_dates
        : [],
    };
  } catch {
    return null;
  }
}

function loadState(): StoredState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
    if (!raw) return emptyState();
    return parseStored(raw) ?? emptyState();
  } catch {
    return emptyState();
  }
}

function saveState(s: StoredState) {
  try {
    const toSave = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      profile: s.profile,
      submission_dates: s.submission_dates,
      streak_count: s.streak_count,
      last_submitted_at: s.last_submitted_at,
    };
    localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn("VerseQuest: failed to save app data to localStorage", e);
  }
}

export function useVerseQuest(liveStats: UserStats | null = null) {
  const { locale } = useLocale();
  const [state, setState] = useState<StoredState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  /** Drop stale sync responses when a newer sync was started (submit vs initial load). */
  const streakSyncGenRef = useRef(0);

  /** Merge local streak fields with Google Sheet (union dates, no deletions). Optional verse marks month tab + community sheet. */
  const syncStreakWithSheet = useCallback(
    async (
      snapshot: StoredState,
      verseToday?: { book: string; chapter: number; verse: number; verse_text: string; dateYmd: string }
    ) => {
      if (!snapshot.profile.phone) return;
      const gen = ++streakSyncGenRef.current;
      try {
        const body: Record<string, unknown> = {
          phone: snapshot.profile.phone,
          name: snapshot.profile.name,
          ranting: snapshot.profile.ranting,
          submission_dates: snapshot.submission_dates,
          xp_total: snapshot.xp_total,
        };
        if (verseToday) {
          body.verse_today = {
            book: verseToday.book,
            chapter: verseToday.chapter,
            verse: verseToday.verse,
            verse_text: verseToday.verse_text,
            date: verseToday.dateYmd,
          };
        }
        const res = await fetch("/api/streak-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          merged?: StreakSyncMergedPayload;
        };
        if (!data.ok || !data.merged) return;
        if (gen !== streakSyncGenRef.current) return;
        const m = data.merged;
        console.log("[useVerseQuest] streak-sync response", {
          streak_count: m.streak_count,
          last_submitted_at: m.last_submitted_at,
          submission_dates: m.submission_dates,
        });
        setState((prev) => {
          console.log("[useVerseQuest] setState after sync — prev streak:", prev.streak_count, "→ next streak:", m.streak_count);
          const next: StoredState = {
            ...prev,
            submission_dates: m.submission_dates,
            streak_count: m.streak_count,
            last_submitted_at: m.last_submitted_at,
            xp_total: m.xp_total,
          };
          saveState(next);
          return next;
        });
        if (verseToday && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("versequest-community-refresh"));
        }
      } catch {
        // Offline or server error — local cache remains authoritative until next sync.
      }
    },
    []
  );

  useEffect(() => {
    // Client-only: read persisted profile from localStorage after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration
    setState(loadState());
    setHydrated(true);
  }, []);

  /** Apply live stats from the sheet whenever they arrive or refresh (e.g. route change). */
  useEffect(() => {
    if (!hydrated || !liveStats) return;
    console.log("[useVerseQuest] liveStats arrived", {
      streak_count: liveStats.streak_count,
      last_submitted_at: liveStats.last_submitted_at,
      xp_total: liveStats.xp_total,
    });
    setState((prev) => {
      const next_streak = Math.max(prev.streak_count, liveStats.streak_count);
      console.log("[useVerseQuest] liveStats setState — prev streak:", prev.streak_count, "liveStats streak:", liveStats.streak_count, "→ next streak:", next_streak);
      return {
        ...prev,
        // Never downgrade streak_count — streak-sync may have already computed a higher value
        // from the month tabs, while liveStats reads from the main sheet (a separate, stale column).
        streak_count: next_streak,
        xp_total: Math.max(prev.xp_total, liveStats.xp_total),
        last_submitted_at: liveStats.last_submitted_at,
      };
    });
  }, [hydrated, liveStats]);

  /** Sync when another tab updates app data (same origin). */
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== APP_DATA_STORAGE_KEY || e.newValue == null) return;
      const next = parseStored(e.newValue);
      if (next) setState(next);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /**
   * The sheet is the source of truth for which ranting a member belongs to.
   * The cached `ranting` is only a hint for which tab to check first — if the
   * sheet has since moved/removed the row, re-resolve it before syncing so we
   * never write attendance marks against a stale ranting.
   */
  const reconcileRanting = useCallback(
    async (snapshot: StoredState): Promise<StoredState> => {
      if (!snapshot.profile.phone) return snapshot;
      try {
        const month = new Date().getMonth() + 1;
        const res = await fetch("/api/preregister-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: snapshot.profile.phone,
            month,
            locale,
            ranting: snapshot.profile.ranting,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          ranting?: string;
          coordinator_ranting?: string | null;
        };
        if (!data.ok || !data.ranting || data.ranting === snapshot.profile.ranting) {
          return snapshot;
        }
        console.log("[useVerseQuest] ranting reconciled", {
          from: snapshot.profile.ranting,
          to: data.ranting,
        });
        const next: StoredState = {
          ...snapshot,
          profile: {
            ...snapshot.profile,
            ranting: data.ranting,
            coordinator_ranting: data.coordinator_ranting ?? snapshot.profile.coordinator_ranting,
          },
        };
        saveState(next);
        setState(next);
        return next;
      } catch {
        // Offline or lookup failure — keep the cached ranting for this pass.
        return snapshot;
      }
    },
    [locale]
  );

  /** After login or on load: two-way merge with sheet. Fires immediately — fully async, does not block render. */
  useEffect(() => {
    if (!hydrated || !state.profile.phone) return;
    void (async () => {
      const reconciled = await reconcileRanting(loadState());
      void syncStreakWithSheet(reconciled);
    })();
  }, [hydrated, state.profile.phone, reconcileRanting, syncStreakWithSheet]);

  const registerProfile = useCallback(
    async (phoneInput: string, ranting?: string): Promise<{ ok: boolean; error?: string }> => {
      const month = new Date().getMonth() + 1;
      let data: { ok?: boolean; error?: string; name?: string; canonicalPhone?: string; is_coordinator?: boolean; coordinator_ranting?: string | null };
      try {
        const res = await fetch("/api/preregister-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneInput, month, locale, ranting }),
        });
        data = (await res.json()) as typeof data;
      } catch {
        return { ok: false, error: messages[locale].loginErrorGeneric };
      }
      if (!data.ok || !data.name || !data.canonicalPhone) {
        return { ok: false, error: data.error ?? messages[locale].loginErrorGeneric };
      }
      setState((prev) => {
        const next = {
          ...prev,
          profile: {
            name: data.name!,
            phone: data.canonicalPhone!,
            ...(ranting ? { ranting } : {}),
            is_coordinator: data.is_coordinator ?? false,
            coordinator_ranting: data.coordinator_ranting ?? null,
          },
        };
        saveState(next);
        return next;
      });
      // Notify BottomNav (same tab) that the profile was written
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("versequest-profile-updated"));
      }
      return { ok: true };
    },
    [locale]
  );

  const displayStreak = useMemo(
    () => getDisplayStreak(state),
    [state]
  );
  const submittedToday = useMemo(
    () => hasSubmittedToday(state.last_submitted_at),
    [state.last_submitted_at]
  );

  const weekDots = useMemo(
    () => getWeekDots(state.submission_dates),
    [state.submission_dates]
  );

  const moodEmoji = useMemo(() => {
    const lossStreak = computeLossStreakFromLastSubmit(state.last_submitted_at, getTodayString());
    return getMoodEmoji(displayStreak, lossStreak);
  }, [displayStreak, state.last_submitted_at]);

  const submitVerse = useCallback(
    (payload: Omit<VerseSubmission, "submitted_at">): { ok: boolean; error?: string } => {
      const m = messages[locale];
      const todayStr = toLocalDateString(new Date());
      const yesterdayStr = toLocalDateString(new Date(Date.now() - 86400000));
      let err: string | undefined;
      setState((prev) => {
        if (!prev.profile.name || !prev.profile.phone) {
          err = m.errSubmitSignIn;
          return prev;
        }
        if (hasSubmittedToday(prev.last_submitted_at)) {
          err = m.errSubmitAlreadyToday;
          return prev;
        }
        const newStreak = computeStreakAfterSubmit(prev, todayStr, yesterdayStr);
        const submission_dates = prev.submission_dates.includes(todayStr)
          ? prev.submission_dates
          : [...prev.submission_dates, todayStr];
        const next: StoredState = {
          ...prev,
          streak_count: newStreak,
          last_submitted_at: todayStr,
          xp_total: prev.xp_total + 10,
          submission_dates,
        };
        saveState(next);
        const verseToday =
          payload.book && Number.isFinite(payload.chapter) && Number.isFinite(payload.verse)
            ? {
                book: payload.book,
                chapter: payload.chapter,
                verse: payload.verse,
                verse_text: payload.verse_text ?? "",
                dateYmd: todayStr,
              }
            : undefined;
        void syncStreakWithSheet(next, verseToday);
        return next;
      });
      if (err) return { ok: false, error: err };
      return { ok: true };
    },
    [locale, syncStreakWithSheet]
  );

  /**
   * Wipes only the profile fields from both React state and localStorage.
   * Streak, XP, and submission dates are preserved so re-login can sync them.
   */
  const clearProfile = useCallback(() => {
    setState((prev) => {
      const next: StoredState = {
        ...prev,
        profile: { name: "", phone: "" },
      };
      saveState(next);
      return next;
    });
  }, []);

  return {
    hydrated,
    state,
    displayStreak,
    submittedToday,
    weekDots,
    moodEmoji,
    registerProfile,
    clearProfile,
    submitVerse,
  };
}
