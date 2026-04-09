"use client";

import { useLayoutEffect, useMemo, useState, useEffect } from "react";
import { PhoneRegistrationScreen } from "@/components/PhoneRegistrationScreen";
import { VerseQuestHome } from "@/components/VerseQuestHome";
import { useDisplayOrder } from "@/contexts/DisplayOrderContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useFirmanPoll } from "@/hooks/useFirmanPoll";
import { useGratitudeQuest } from "@/hooks/useGratitudeQuest";
import { useVerseQuest } from "@/hooks/useVerseQuest";
import type { FirmanPollConfig } from "@/lib/firman-poll-config";
import { messages } from "@/lib/i18n";
import { getRantingList } from "@/lib/constants";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";

/**
 * Root shell: hydration gates, phone gate, then delegates the main experience to {@link VerseQuestHome}.
 */
export function VerseQuestApp() {
  const { locale, hydrated: localeReady } = useLocale();
  const { hydrated: displayOrderReady } = useDisplayOrder();
  const m = messages[locale];

  const {
    hydrated,
    state,
    displayStreak,
    submittedToday,
    weekDots,
    moodEmoji,
    registerProfile,
    submitVerse,
  } = useVerseQuest();

  // Single fetch for today's devotion — both devotionAvailable and firmanConfig come from this.
  const [firmanConfig, setFirmanConfig] = useState<FirmanPollConfig | null>(null);
  const [devotionAvailable, setDevotionAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    void fetch("/api/devotion/today")
      .then((r) => r.json())
      .then((d: { devotion?: string | null; reflection?: string[] }) => {
        setDevotionAvailable(!!d.devotion);
        const items = d.reflection ?? [];
        if (items.length === 0) {
          setFirmanConfig(null);
          return;
        }
        const config: FirmanPollConfig = {
          questions: items.map((text, i) => ({
            id: `r${i}`,
            text,
            textId: text,
          })),
        };
        setFirmanConfig(config);
      })
      .catch(() => {
        setDevotionAvailable(false);
        setFirmanConfig(null);
      });
  }, []);

  const firmanPoll = useFirmanPoll();
  const gratitudeQuest = useGratitudeQuest();

  const [portalReady, setPortalReady] = useState(false);

  useLayoutEffect(() => {
    setPortalReady(true);
  }, []);

  const waitingForShell =
    !hydrated ||
    !localeReady ||
    !firmanPoll.hydrated ||
    !gratitudeQuest.hydrated ||
    !displayOrderReady;

  if (waitingForShell) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vq-canvas)] text-[var(--vq-muted)]">
        {m.loading}
      </div>
    );
  }

  // If ranting mode is active but the stored profile has no ranting, the session
  // pre-dates ranting support. Clear it and force the user to log in again so they
  // can pick their ranting from the dropdown.
  const rantingRequired = getRantingList().length > 0;
  const profileMissingRanting =
    rantingRequired &&
    !!state.profile.name &&
    !!state.profile.phone &&
    !state.profile.ranting;

  if (profileMissingRanting) {
    // Clear only the profile fields — preserve streak/xp so they aren't lost.
    // On re-login registerProfile will write the new profile including ranting.
    try {
      const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        parsed.profile = { name: "", phone: "" };
        localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      localStorage.removeItem(APP_DATA_STORAGE_KEY);
    }
  }

  if (!state.profile.name || !state.profile.phone || profileMissingRanting) {
    return <PhoneRegistrationScreen registerProfile={registerProfile} />;
  }

  return (
    <VerseQuestHome
      state={state}
      displayStreak={displayStreak}
      submittedToday={submittedToday}
      weekDots={weekDots}
      moodEmoji={moodEmoji}
      submitVerse={submitVerse}
      firmanConfig={firmanConfig}
      firmanPoll={firmanPoll}
      gratitudeQuest={gratitudeQuest}
      portalReady={portalReady}
      devotionAvailable={devotionAvailable}
    />
  );
}
