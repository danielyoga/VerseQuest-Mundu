"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { PhoneRegistrationScreen } from "@/components/PhoneRegistrationScreen";
import { VerseQuestHome } from "@/components/VerseQuestHome";
import { useDisplayOrder } from "@/contexts/DisplayOrderContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useFirmanPoll } from "@/hooks/useFirmanPoll";
import { useGratitudeQuest } from "@/hooks/useGratitudeQuest";
import { useVerseQuest } from "@/hooks/useVerseQuest";
import { getFirmanPollConfig } from "@/lib/firman-poll-config";
import { messages } from "@/lib/i18n";

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

  const firmanConfig = useMemo(() => getFirmanPollConfig(), []);
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

  if (!state.profile.name || !state.profile.phone) {
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
    />
  );
}
