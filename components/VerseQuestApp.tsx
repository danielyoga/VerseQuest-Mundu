"use client";

import { useLayoutEffect, useMemo, useState, useEffect } from "react";
import { PhoneRegistrationScreen } from "@/components/PhoneRegistrationScreen";
import { VerseQuestHome } from "@/components/VerseQuestHome";
import { useDisplayOrder } from "@/contexts/DisplayOrderContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useUserContext } from "@/contexts/UserContext";
import { useFirmanPoll } from "@/hooks/useFirmanPoll";
import { useGratitudeQuest } from "@/hooks/useGratitudeQuest";
import { useVerseQuest } from "@/hooks/useVerseQuest";
import type { FirmanPollConfig } from "@/lib/firman-poll-config";
import { messages } from "@/lib/i18n";
import { getRantingList } from "@/lib/constants";

/**
 * Root shell: hydration gates, phone gate, then delegates the main experience to {@link VerseQuestHome}.
 */
export function VerseQuestApp() {
  const { locale, hydrated: localeReady } = useLocale();
  const { hydrated: displayOrderReady } = useDisplayOrder();
  const { stats, statsLoading } = useUserContext();
  const m = messages[locale];

  const {
    hydrated,
    state,
    displayStreak,
    submittedToday,
    weekDots,
    moodEmoji,
    registerProfile,
    clearProfile,
    submitVerse,
  } = useVerseQuest(stats);

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

  const rantingList = getRantingList();
  const rantingRequired = rantingList.length > 0;

  const profileMissingRanting =
    hydrated &&
    rantingRequired &&
    !!state.profile.name &&
    !!state.profile.phone &&
    !state.profile.ranting;

  useEffect(() => {
    if (!profileMissingRanting) return;
    clearProfile();
  }, [profileMissingRanting, clearProfile]);

  const waitingForShell =
    !hydrated ||
    !localeReady ||
    !firmanPoll.hydrated ||
    !gratitudeQuest.hydrated ||
    !displayOrderReady ||
    (!!state.profile.phone && statsLoading && !stats) ||
    (!!state.profile.phone && devotionAvailable === null);

  if (waitingForShell) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vq-canvas)] text-[var(--vq-muted)]">
        {m.loading}
      </div>
    );
  }

  if (!state.profile.name || !state.profile.phone || profileMissingRanting) {
    return <PhoneRegistrationScreen registerProfile={registerProfile} />;
  }

  return (
    <VerseQuestHome
      state={state}
      displayStreak={displayStreak}
      weekDots={weekDots}
      submittedToday={submittedToday}
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
