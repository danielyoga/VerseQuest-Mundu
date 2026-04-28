"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSettingsButton } from "@/components/AppSettingsButton";
import { FirmanPollModal } from "@/components/FirmanPollModal";
import { GratitudeModal } from "@/components/GratitudeModal";
import { useDisplayOrder } from "@/contexts/DisplayOrderContext";
import { useLocale } from "@/contexts/LocaleContext";
import { scheduleVerseKey, useTodayScheduleWindow } from "@/hooks/useTodayScheduleWindow";
import { bookDisplayName } from "@/lib/bible/book-names-id";
import {
  formatHeaderDate,
  greetingLine,
  messages,
} from "@/lib/i18n";
import { computeLossStreakFromLastSubmit, getMoodMessage } from "@/lib/moodEmoji";
import { getTodayString } from "@/lib/sheetName";
import type { WeekDotState } from "@/lib/streak/streak";
import type { StoredState } from "@/types";
import type { VerseSubmission } from "@/types";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

type VerseQuestHomeProps = {
  state: StoredState;
  displayStreak: number;
  submittedToday: boolean;
  weekDots: WeekDotState[];
  moodEmoji: string;
  submitVerse: (
    payload: Omit<VerseSubmission, "submitted_at">
  ) => { ok: boolean; error?: string };
  firmanConfig: ReturnType<typeof import("@/lib/firman-poll-config").getFirmanPollConfig>;
  firmanPoll: ReturnType<typeof import("@/hooks/useFirmanPoll").useFirmanPoll>;
  gratitudeQuest: ReturnType<typeof import("@/hooks/useGratitudeQuest").useGratitudeQuest>;
  portalReady: boolean;
  /** Whether today's devotion content exists in the sheet (resolved by parent). */
  devotionAvailable: boolean | null;
};

export function VerseQuestHome({
  state,
  displayStreak,
  submittedToday,
  weekDots,
  moodEmoji,
  submitVerse,
  firmanConfig,
  firmanPoll,
  gratitudeQuest,
  portalReady,
  devotionAvailable,
}: VerseQuestHomeProps) {
  const { locale } = useLocale();
  const { displayOrder } = useDisplayOrder();
  const m = messages[locale];
  const {
    todaySchedule,
    schedulePassage,
    schedulePassageStatus,
    scheduleVerseSelectedKey,
    setScheduleVerseSelectedKey,
  } = useTodayScheduleWindow();

  const router = useRouter();
  const [successOpen, setSuccessOpen] = useState(false);
  const [firmanOpen, setFirmanOpen] = useState(false);
  const [firmanModalKey, setFirmanModalKey] = useState(0);
  const [gratitudeOpen, setGratitudeOpen] = useState(false);
  const [gratitudeModalKey, setGratitudeModalKey] = useState(0);
  const verseSubmitLock = useRef(false);

  // Devotion task state
  const devotionKey = `versequest_devotion_${getTodayString()}`;
  const [devotionRead, setDevotionRead] = useState(false);

  useEffect(() => {
    setDevotionRead(localStorage.getItem(devotionKey) === "read");
  }, [devotionKey]);

  const taskDone = submittedToday;
  const displayName = state.profile.name || (locale === "id" ? "Anda" : "there");

  const headerDate = useMemo(
    () => formatHeaderDate(locale, new Date()),
    [locale]
  );

  const greetingText = useMemo(
    () => greetingLine(locale, displayName, new Date().getHours()),
    [locale, displayName]
  );

  const streakText = useMemo(() => {
    const lossStreak = computeLossStreakFromLastSubmit(state.last_submitted_at, getTodayString());
    return getMoodMessage(displayStreak, lossStreak);
  }, [displayStreak, state.last_submitted_at]);

  const totalQuests = 3 + (firmanConfig ? 1 : 0);
  const doneQuests =
    (submittedToday ? 1 : 0) +
    (devotionRead ? 1 : 0) +
    (gratitudeQuest.doneForToday ? 1 : 0) +
    (firmanConfig && firmanPoll.doneForToday ? 1 : 0);
  const progress = totalQuests ? (doneQuests / totalQuests) * 100 : 0;

  const canSubmitFromReadingList =
    schedulePassageStatus === "ok" &&
    schedulePassage != null &&
    schedulePassage.length > 0;

  function handleSubmitFromSchedule(row: {
    chapter: number;
    verse: number;
    text: string;
  }) {
    if (!todaySchedule || taskDone || verseSubmitLock.current) return;
    verseSubmitLock.current = true;
    try {
      const r = submitVerse({
        book: todaySchedule.book,
        chapter: row.chapter,
        verse: row.verse,
        verse_text: row.text.trim(),
      });
      if (!r.ok) {
        window.alert(r.error ?? m.errSubmitGeneric);
        return;
      }
      window.setTimeout(() => setSuccessOpen(true), 200);
    } finally {
      verseSubmitLock.current = false;
    }
  }

  useLayoutEffect(() => {
    if (!successOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [successOpen]);

  const missionsSection = (
    <div>
      <p className="mb-2.5 px-5 text-[13px] font-medium uppercase tracking-wide text-[var(--vq-muted)]">
        {m.questToday}
      </p>

      <div className="mx-5 mb-3 rounded-[var(--vq-radius-lg)] border border-[var(--vq-border)] bg-[var(--vq-bg-2)] p-4">
        <div className="flex gap-3.5 items-center">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
              taskDone ? "bg-[#EAF3DE]" : "bg-[#FAEEDA]"
            }`}
          >
            {taskDone ? "✅" : "📖"}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-[var(--vq-text)]">{m.taskTitle}</p>
              <p className="mt-0.5 text-xs text-[var(--vq-muted)]">
                {taskDone ? m.taskDescDone : m.taskDescPending}
              </p>
            </div>
            <span
              className={`shrink-0 self-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${
                taskDone ? "bg-[#EAF3DE] text-[#27500A]" : "bg-[#FAEEDA] text-[#633806]"
              }`}
            >
              {taskDone ? m.badgeDone : m.badgePending}
            </span>
          </div>
        </div>
        <div className="mt-4">
          {taskDone ? (
            <div className="flex w-full min-h-[52px] items-center justify-center rounded-2xl bg-[#3B6D11] py-4 text-base font-medium text-white">
              {m.ctaDone}
            </div>
          ) : canSubmitFromReadingList ? (
            <p className="text-center text-sm leading-relaxed text-[var(--vq-muted)]">{m.taskVerseHowTo}</p>
          ) : schedulePassageStatus === "loading" ? (
            <p className="text-center text-sm text-[var(--vq-muted)]">{m.scheduleLoadingPassage}</p>
          ) : schedulePassageStatus === "verses_pending" ? (
            <p className="text-center text-sm leading-relaxed text-[var(--vq-muted)]">{m.scheduleVersesPending}</p>
          ) : (
            <p className="text-center text-sm leading-relaxed text-[var(--vq-muted)]">{m.taskVerseNoReading}</p>
          )}
        </div>
      </div>

      {/* Devotion task card */}
      <div className="mx-5 mb-3 rounded-[var(--vq-radius-lg)] border border-[var(--vq-border)] bg-[var(--vq-bg-2)] p-4">
        <div className="flex gap-3.5 items-center">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
              devotionAvailable ? "bg-[#FEF3C7]" : "bg-[var(--vq-bg)]"
            }`}
          >
            📖
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[var(--vq-text)]">{m.devotionTaskTitle}</p>
              <p className="mt-0.5 text-xs text-[var(--vq-muted)]">
                {devotionRead
                  ? m.devotionTaskDoneDesc
                  : devotionAvailable
                    ? m.devotionTaskAvailableDesc
                    : m.devotionTaskUnavailableDesc}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => router.push("/devotional")}
            className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#534AB7] py-4 text-base font-medium text-white transition hover:bg-[#3C3489] active:scale-[0.98]"
          >
            {m.devotionTaskReadCta}
          </button>
        </div>
      </div>

      <div className="mx-5 mb-3 rounded-[var(--vq-radius-lg)] border border-[var(--vq-border)] bg-[var(--vq-bg-2)] p-4">
        <div className="flex gap-3.5 items-center">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
              firmanPoll.doneForToday ? "bg-[#EAF3DE]" : "bg-[#FAEEDA]"
            }`}
          >
            {firmanPoll.doneForToday ? "✅" : "🙏"}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium leading-snug text-[var(--vq-text)]">{m.task2Title}</p>
              <p className="mt-0.5 text-xs text-[var(--vq-muted)]">
                {firmanPoll.doneForToday
                  ? m.task2DescDone
                  : firmanPoll.doneYesterday
                    ? m.task2DescYesterday
                    : m.task2DescPending}
              </p>
            </div>
            <span
              className={`shrink-0 self-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${
                firmanPoll.doneForToday
                  ? "bg-[#EAF3DE] text-[#27500A]"
                  : "bg-[#FAEEDA] text-[#633806]"
              }`}
            >
              {firmanPoll.doneForToday ? m.badgeDone : m.badgePending}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              setFirmanModalKey((k) => k + 1);
              setFirmanOpen(true);
            }}
            className={`flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl py-4 text-base font-medium transition active:scale-[0.98] ${
              firmanPoll.doneForToday
                ? "cursor-default bg-[#3B6D11] text-white"
                : "bg-[#534AB7] text-white hover:bg-[#3C3489]"
            }`}
          >
            {firmanPoll.doneForToday ? m.firmanPollCtaDone : m.firmanPollCta}
          </button>
        </div>
      </div>

      <div className="mx-5 mb-3 rounded-[var(--vq-radius-lg)] border border-[var(--vq-border)] bg-[var(--vq-bg-2)] p-4">
        <div className="flex gap-3.5 items-center">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
              gratitudeQuest.doneForToday ? "bg-[#EAF3DE]" : "bg-[#FAEEDA]"
            }`}
          >
            {gratitudeQuest.doneForToday ? "✅" : "💛"}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium leading-snug text-[var(--vq-text)]">
                {m.taskGratitudeTitle}
              </p>
              <p className="mt-0.5 text-xs text-[var(--vq-muted)]">
                {gratitudeQuest.doneForToday
                  ? m.taskGratitudeDescDone
                  : m.taskGratitudeDescPending}
              </p>
            </div>
            <span
              className={`shrink-0 self-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${
                gratitudeQuest.doneForToday
                  ? "bg-[#EAF3DE] text-[#27500A]"
                  : "bg-[#FAEEDA] text-[#633806]"
              }`}
            >
              {gratitudeQuest.doneForToday ? m.badgeDone : m.badgePending}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              setGratitudeModalKey((k) => k + 1);
              setGratitudeOpen(true);
            }}
            className={`flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl py-4 text-base font-medium transition active:scale-[0.98] ${
              gratitudeQuest.doneForToday
                ? "cursor-default bg-[#3B6D11] text-white"
                : "bg-[#534AB7] text-white hover:bg-[#3C3489]"
            }`}
          >
            {gratitudeQuest.doneForToday ? m.gratitudeCtaDone : m.gratitudeCta}
          </button>
        </div>
      </div>
    </div>
  );

  const readingScheduleCard = (
    <div className="rounded-[var(--vq-radius-lg)] border border-[var(--vq-border)] bg-[var(--vq-bg-2)] p-4">
      <p className="mb-2 text-[13px] font-medium text-[var(--vq-text)]">{m.scheduleHeading}</p>
      {schedulePassageStatus === "loading" && (
        <p className="text-sm text-[var(--vq-muted)]">{m.scheduleLoadingPassage}</p>
      )}
      {schedulePassageStatus === "no_plan" && (
        <p className="text-sm leading-snug text-[var(--vq-muted)]">{m.scheduleNoPlan}</p>
      )}
      {schedulePassageStatus === "error" && (
        <p className="text-sm text-red-700">{m.schedulePassageError}</p>
      )}
      {todaySchedule &&
        (schedulePassageStatus === "ok" || schedulePassageStatus === "verses_pending") && (
          <div>
            <div className="space-y-1">
              <p className="text-[15px] font-semibold text-[var(--vq-text)]">
                {bookDisplayName(todaySchedule.book, locale)}
              </p>
              <p className="text-sm leading-snug text-[var(--vq-muted)]">{todaySchedule.reading}</p>
            </div>

            {schedulePassageStatus === "verses_pending" && (
              <p className="mt-3 text-sm leading-snug text-amber-800">{m.scheduleVersesPending}</p>
            )}
            {schedulePassageStatus === "ok" &&
              schedulePassage &&
              schedulePassage.length > 0 && (
                <div className="mt-3 max-h-[min(50vh,360px)] overflow-y-auto border-t border-[var(--vq-border)] pt-3">
                  <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-[var(--vq-muted)]">
                    {m.scheduleTranslationNote}
                  </p>
                  {schedulePassage.map((row, i) => {
                    const rowKey = scheduleVerseKey(row);
                    const selected = scheduleVerseSelectedKey === rowKey;
                    return (
                      <div key={`${rowKey}-${i}`}>
                        {(i === 0 || schedulePassage[i - 1]!.chapter !== row.chapter) && (
                          <p className="mb-1.5 mt-2 first:mt-0 text-xs font-semibold text-[var(--vq-muted)]">
                            {m.scheduleChapterHeading(row.chapter)}
                          </p>
                        )}
                        <div className="mb-2.5 flex items-center gap-2 last:mb-0">
                          <button
                            type="button"
                            onClick={() =>
                              setScheduleVerseSelectedKey((k) => (k === rowKey ? null : rowKey))
                            }
                            className={`touch-manipulation min-w-0 flex-1 rounded-lg px-1.5 py-1 text-left text-[14px] leading-relaxed text-[var(--vq-text)] transition-colors ${
                              selected
                                ? "bg-[#EEEDFE]"
                                : "hover:bg-[var(--vq-bg)] active:bg-[#EEEDFE]/60"
                            }`}
                          >
                            <span className="mr-1.5 font-semibold tabular-nums text-[#534AB7]">
                              {row.chapter}:{row.verse}
                            </span>
                            {row.text}
                          </button>
                          {selected && !taskDone && (
                            <button
                              type="button"
                              onClick={() => handleSubmitFromSchedule(row)}
                              className="touch-manipulation shrink-0 rounded-lg bg-[#534AB7] px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#3C3489] active:scale-[0.98]"
                              aria-label={m.scheduleVerseSubmitAria}
                            >
                              {m.submitVerse}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--vq-canvas)] py-6">
      <div className="relative mx-auto flex min-h-[780px] max-w-[390px] flex-col overflow-hidden rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)]">
        <div className="flex items-center justify-between gap-2 px-3 pb-1.5 pt-3 text-xs font-medium text-[var(--vq-muted)] sm:px-5">
          <span className="min-w-0 flex-1 capitalize leading-snug">{headerDate}</span>
          <AppSettingsButton />
        </div>

        <header className="flex items-center justify-between px-5 pb-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#534AB7] text-lg text-white">
              📖
            </div>
            <div className="text-lg font-medium text-[var(--vq-text)]">
              Verse<span className="text-[#534AB7]">Quest</span>
            </div>
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEEDFE] text-sm font-medium text-[#534AB7]"
            title={m.profileTitle}
          >
            {initials(displayName)}
          </div>
        </header>

        <section className="px-5 pb-4">
          <p className="text-[22px] font-medium leading-snug text-[var(--vq-text)]">{greetingText}</p>
          <p className="mt-1 text-sm text-[var(--vq-muted)]">
            {taskDone ? m.subtitleDone : m.subtitlePending}
          </p>
        </section>

        <section className="relative mx-5 mb-4 overflow-hidden rounded-[20px] bg-[var(--vq-brand)] px-5 py-5 text-[var(--vq-on-brand)]">
          <div className="pointer-events-none absolute -right-8 -top-8 h-[120px] w-[120px] rounded-full bg-white/[0.06]" />
          <div className="pointer-events-none absolute bottom-[-20px] right-10 h-20 w-20 rounded-full bg-white/[0.05]" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--vq-on-brand-muted)]">
                {m.streakLabel}
              </p>
              <p className="text-5xl font-medium leading-none">{displayStreak}</p>
              <p className="mt-1 text-sm text-[var(--vq-on-brand-muted)]">{m.streakUnit}</p>
            </div>
            <span className="text-5xl leading-none" aria-hidden>
              {moodEmoji}
            </span>
          </div>
          <p className="relative mt-3.5 border-t border-white/25 pt-3.5 text-[13px] leading-snug text-[var(--vq-on-brand-subtle)]">
            {streakText}
          </p>
          <div className="relative mt-3.5 flex gap-1.5">
            {m.weekLabels.map((label, i) => {
              const kind = weekDots[i];
              const dotClass =
                kind === "done"
                  ? "bg-white text-[var(--vq-brand)] font-medium"
                  : kind === "today"
                    ? "bg-[#FAC775] text-[#412402] font-medium"
                    : kind === "missed"
                      ? "bg-white/25 text-[var(--vq-on-brand)]"
                      : "bg-white/20 text-[var(--vq-on-brand-muted)]";
              const inner =
                kind === "done" ? "✓" : kind === "today" ? "!" : "·";
              return (
                <div key={`${label}-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-medium uppercase text-[var(--vq-on-brand-muted)]">
                    {label}
                  </span>
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${dotClass}`}
                  >
                    {inner}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mb-2 flex justify-between px-5 text-xs text-[var(--vq-muted)]">
          <span>{m.progressToday}</span>
          <span>{m.progressTasks(doneQuests, totalQuests)}</span>
        </div>
        <div className="mx-5 mb-4 h-2 overflow-hidden rounded-lg bg-[var(--vq-bg-2)]">
          <div
            className="h-full rounded-lg bg-[#534AB7] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex flex-col">
          <div
            className={
              displayOrder === "reading_first" ? "order-2 pb-6" : "order-1"
            }
          >
            {missionsSection}
          </div>
          <div
            className={
              displayOrder === "reading_first"
                ? "order-1 mb-3 px-5"
                : "order-2 px-5 pb-6"
            }
          >
            {readingScheduleCard}
          </div>
        </div>

        <GratitudeModal
          key={`gratitude-${gratitudeModalKey}`}
          open={gratitudeOpen}
          onClose={() => setGratitudeOpen(false)}
          initialItems={gratitudeQuest.savedItems}
          onSubmit={(items) => {
            gratitudeQuest.submit(items);
            setGratitudeOpen(false);
          }}
        />

        <FirmanPollModal
          key={`firman-${firmanModalKey}`}
          open={firmanOpen}
          onClose={() => setFirmanOpen(false)}
          config={firmanConfig ?? { questions: [] }}
          initialAnswers={firmanPoll.savedAnswers}
          onSubmit={(answers) => {
            firmanPoll.submit(answers);
            setFirmanOpen(false);
          }}
        />

        {successOpen &&
          portalReady &&
          createPortal(
            <div
              className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/60 p-6 text-center animate-vq-fade-in"
              style={{ minHeight: "100dvh" }}
            >
              <div className="w-full max-w-[320px] rounded-3xl bg-[var(--vq-bg)] px-7 py-8 shadow-xl">
                <div className="mb-4 text-[56px] animate-vq-bounce-in">🎉</div>
                <h3 className="mb-2 text-[22px] font-medium text-[var(--vq-text)]">{m.successTitle}</h3>
                <p className="mb-5 text-sm leading-relaxed text-[var(--vq-muted)]">
                  {m.successBody(displayName)}
                </p>
                <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[#534AB7] px-5 py-2 text-sm font-medium text-white">
                  <span>⭐</span> {m.successXp}
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessOpen(false)}
                  className="w-full min-h-[52px] rounded-2xl bg-[#534AB7] py-3.5 text-base font-medium text-white hover:bg-[#3C3489]"
                >
                  {m.successCta}
                </button>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
