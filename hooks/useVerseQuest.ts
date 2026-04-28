"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import { toLocalDateString } from "@/lib/date-utils";
import {
  computeStreakAfterSubmit,
  getDisplayStreak,
  getMoodEmoji,
  getWeekDots,
  hasSubmittedToday,
} from "@/lib/streak/streak";
import type { StreakSyncMergedPayload } from "@/lib/streak/sync-merge";
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
    const toSave: StoredState = {
      ...s,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };
    const payload = JSON.stringify(toSave);
    localStorage.setItem(APP_DATA_STORAGE_KEY, payload);
  } catch (e) {
    console.warn("VerseQuest: failed to save app data to localStorage", e);
  }
}

export function useVerseQuest() {
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
        setState((prev) => {
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
    // Client-only: read persisted streak from localStorage after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration
    setState(loadState());
    setHydrated(true);
  }, []);

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

  /** After login or on load: two-way merge with sheet. Deferred 2s to avoid blocking LCP. */
  useEffect(() => {
    if (!hydrated || !state.profile.phone) return;
    const id = setTimeout(() => { void syncStreakWithSheet(loadState()); }, 2000);
    return () => clearTimeout(id);
  }, [hydrated, state.profile.phone, syncStreakWithSheet]);

  const registerProfile = useCallback(
    async (phoneInput: string, ranting?: string): Promise<{ ok: boolean; error?: string }> => {
      const month = new Date().getMonth() + 1;
      let data: { ok?: boolean; error?: string; name?: string; canonicalPhone?: string };
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

  const displayStreak = useMemo(() => getDisplayStreak(state), [state]);
  const submittedToday = useMemo(
    () => hasSubmittedToday(state.last_submitted_at),
    [state.last_submitted_at]
  );

  const weekDots = useMemo(
    () => getWeekDots(state.submission_dates),
    [state.submission_dates]
  );

  const moodEmoji = useMemo(
    () => getMoodEmoji(displayStreak),
    [displayStreak]
  );

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
