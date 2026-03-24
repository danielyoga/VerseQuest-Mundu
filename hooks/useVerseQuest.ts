"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toLocalDateString } from "@/lib/date-utils";
import { id, streakMessageId } from "@/lib/i18n-id";
import {
  computeStreakAfterSubmit,
  getDisplayStreak,
  getMoodEmoji,
  getWeekDots,
  hasSubmittedToday,
} from "@/lib/streak";
import { validatePreregistration } from "@/lib/preregister";
import type { StoredState, VerseSubmission } from "@/types";

const STORAGE_KEY = "versequest_v1";

function emptyState(): StoredState {
  return {
    profile: { name: "", phone: "" },
    streak_count: 0,
    last_submitted_at: null,
    xp_total: 0,
    submission_dates: [],
  };
}

function parseStored(raw: string): StoredState | null {
  try {
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed.profile?.name || !parsed.profile?.phone) return null;
    return {
      ...emptyState(),
      ...parsed,
      profile: {
        name: parsed.profile.name,
        phone: parsed.profile.phone,
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return parseStored(raw) ?? emptyState();
  } catch {
    return emptyState();
  }
}

function saveState(s: StoredState) {
  try {
    const payload = JSON.stringify(s);
    localStorage.setItem(STORAGE_KEY, payload);
  } catch (e) {
    console.warn("VerseQuest: gagal menyimpan ke localStorage", e);
  }
}

export function useVerseQuest() {
  const [state, setState] = useState<StoredState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Client-only: read persisted streak from localStorage after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration
    setState(loadState());
    setHydrated(true);
  }, []);

  /** Sinkron antar tab / jendela: perbarui state jika kunci localStorage berubah di tempat lain */
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || e.newValue == null) return;
      const next = parseStored(e.newValue);
      if (next) setState(next);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const registerProfile = useCallback(
    (phoneInput: string): { ok: boolean; error?: string } => {
      const v = validatePreregistration(phoneInput);
      if (!v.ok) return { ok: false, error: v.error };
      setState((prev) => {
        const next = {
          ...prev,
          profile: { name: v.name, phone: v.canonicalPhone },
        };
        saveState(next);
        return next;
      });
      return { ok: true };
    },
    []
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

  const streakMessage = useMemo(
    () =>
      streakMessageId(
        displayStreak,
        state.profile.name || "Anda",
        !submittedToday
      ),
    [displayStreak, state.profile.name, submittedToday]
  );

  const submitVerse = useCallback(
    (payload: Omit<VerseSubmission, "submitted_at">): { ok: boolean; error?: string } => {
      void payload;
      const todayStr = toLocalDateString(new Date());
      const yesterdayStr = toLocalDateString(new Date(Date.now() - 86400000));
      let err: string | undefined;
      setState((prev) => {
        if (!prev.profile.name || !prev.profile.phone) {
          err = id.errSubmitSignIn;
          return prev;
        }
        if (hasSubmittedToday(prev.last_submitted_at)) {
          err = id.errSubmitAlreadyToday;
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
        return next;
      });
      if (err) return { ok: false, error: err };
      return { ok: true };
    },
    []
  );

  return {
    hydrated,
    state,
    displayStreak,
    submittedToday,
    weekDots,
    moodEmoji,
    streakMessage,
    registerProfile,
    submitVerse,
  };
}
