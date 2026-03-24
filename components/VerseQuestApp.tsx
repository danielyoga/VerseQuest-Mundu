"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useVerseQuest } from "@/hooks/useVerseQuest";
import { VerseModal } from "@/components/VerseModal";
import { LangToggle } from "@/components/LangToggle";
import {
  formatHeaderDate,
  greetingLine,
  messages,
  streakMessage,
} from "@/lib/i18n";
import { bookDisplayName } from "@/lib/book-names-id";
import { constraintFromEntry, getScheduleForDate } from "@/lib/bible-schedule";

type PassageVerse = { chapter: number; verse: number; text: string };

function scheduleVerseKey(row: PassageVerse) {
  return `${row.chapter}-${row.verse}`;
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export function VerseQuestApp() {
  const { locale, hydrated: localeReady } = useLocale();
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

  const [phoneDraft, setPhoneDraft] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [verseOpen, setVerseOpen] = useState(false);
  const [verseModalKey, setVerseModalKey] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const [schedulePassage, setSchedulePassage] = useState<PassageVerse[] | null>(null);
  const [schedulePassageStatus, setSchedulePassageStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [scheduleVerseSelectedKey, setScheduleVerseSelectedKey] = useState<string | null>(null);
  const [scheduleVerseCopiedKey, setScheduleVerseCopiedKey] = useState<string | null>(null);

  const progress = submittedToday ? 100 : 0;
  const taskDone = submittedToday;

  const displayName = state.profile.name || (locale === "id" ? "Anda" : "there");

  const headerDate = useMemo(
    () => formatHeaderDate(locale, new Date()),
    [locale]
  );

  const greetingText = useMemo(() => {
    return greetingLine(locale, displayName, new Date().getHours());
  }, [locale, displayName]);

  const streakText = useMemo(
    () =>
      streakMessage(
        locale,
        displayStreak,
        state.profile.name || (locale === "id" ? "Anda" : "friend"),
        !submittedToday
      ),
    [locale, displayStreak, state.profile.name, submittedToday]
  );

  const { todaySchedule, readingConstraint } = useMemo(() => {
    const e = getScheduleForDate(new Date());
    return {
      todaySchedule: e,
      readingConstraint: e ? constraintFromEntry(e) : null,
    };
  }, []);

  useEffect(() => {
    if (!todaySchedule) {
      setSchedulePassage(null);
      setSchedulePassageStatus("idle");
      return;
    }
    const ac = new AbortController();
    setSchedulePassageStatus("loading");
    setSchedulePassage(null);

    const q = new URLSearchParams({
      book: todaySchedule.book,
      reading: todaySchedule.reading,
    });

    fetch(`/api/bible-passage?${q.toString()}`, { signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("bad_response");
        const data = (await res.json()) as { verses: PassageVerse[] };
        return data.verses;
      })
      .then((verses) => {
        if (!ac.signal.aborted) {
          setSchedulePassage(verses);
          setSchedulePassageStatus("ok");
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ac.signal.aborted) setSchedulePassageStatus("error");
      });

    return () => ac.abort();
  }, [todaySchedule]);

  useEffect(() => {
    setScheduleVerseSelectedKey(null);
    setScheduleVerseCopiedKey(null);
  }, [schedulePassage]);

  useEffect(() => {
    if (!scheduleVerseCopiedKey) return;
    const t = window.setTimeout(() => setScheduleVerseCopiedKey(null), 2000);
    return () => clearTimeout(t);
  }, [scheduleVerseCopiedKey]);

  async function copyScheduleVerseToClipboard(row: PassageVerse) {
    if (!todaySchedule) return;
    const bookName = bookDisplayName(todaySchedule.book, locale);
    const line = `${bookName} ${row.chapter}:${row.verse} ${row.text}`;
    try {
      await navigator.clipboard.writeText(line);
      setScheduleVerseCopiedKey(scheduleVerseKey(row));
    } catch {
      /* clipboard unavailable */
    }
  }

  function handleOpenSubmit() {
    if (taskDone) return;
    setVerseModalKey((k) => k + 1);
    setVerseOpen(true);
  }

  function handleSubmitVerse(data: Parameters<typeof submitVerse>[0]) {
    const r = submitVerse(data);
    if (!r.ok) {
      window.alert(r.error ?? m.errSubmitGeneric);
      return;
    }
    setVerseOpen(false);
    window.setTimeout(() => setSuccessOpen(true), 200);
  }

  if (!hydrated || !localeReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vq-canvas)] text-[var(--vq-muted)]">
        {m.loading}
      </div>
    );
  }

  if (!state.profile.name || !state.profile.phone) {
    return (
      <div className="min-h-screen bg-[var(--vq-canvas)] px-4 py-12">
        <div className="mx-auto flex max-w-[390px] flex-col items-center rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)] p-8 shadow-sm">
          <div className="mb-4 flex w-full flex-row items-center justify-end">
            <LangToggle />
          </div>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[10px] bg-[#534AB7] text-2xl text-white">
            📖
          </div>
          <h1 className="text-center text-2xl font-medium text-[var(--vq-text)]">{m.loginTitle}</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-[var(--vq-muted)]">
            {m.loginSubtitle}
          </p>
          <label className="mt-8 w-full">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
              {m.loginPhoneLabel}
            </span>
            <div className="flex gap-2">
              <span className="flex w-[72px] shrink-0 items-center justify-center rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] text-[15px] text-[var(--vq-text)]">
                +62
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phoneDraft}
                onChange={(e) => {
                  setRegisterError(null);
                  setPhoneDraft(e.target.value.replace(/\D/g, ""));
                }}
                placeholder="81234567890"
                className="min-h-[48px] min-w-0 flex-1 rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 text-[15px] text-[var(--vq-text)]"
              />
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-[var(--vq-muted-2)]">
              {m.loginCountryHint}
            </p>
          </label>
          {registerError && (
            <p className="mt-3 w-full rounded-lg bg-red-50 px-3 py-2 text-[13px] leading-snug text-red-800">
              {registerError}
            </p>
          )}
          <button
            type="button"
            disabled={phoneDraft.replace(/\D/g, "").length < 9}
            onClick={() => {
              const r = registerProfile(phoneDraft);
              if (!r.ok) {
                setRegisterError(r.error ?? m.loginErrorGeneric);
                return;
              }
              setRegisterError(null);
            }}
            className="mt-6 w-full min-h-[52px] rounded-2xl bg-[#534AB7] py-4 text-base font-medium text-white transition hover:bg-[#3C3489] disabled:cursor-not-allowed disabled:bg-[var(--vq-bg-2)] disabled:text-[var(--vq-muted-2)]"
          >
            {m.loginContinue}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--vq-canvas)] py-6">
      <div className="relative mx-auto flex min-h-[780px] max-w-[390px] flex-col overflow-hidden rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)]">
        {/* Top bar: date | language | app name */}
        <div className="flex items-center justify-between gap-2 px-3 pb-1.5 pt-3 text-xs font-medium text-[var(--vq-muted)] sm:px-5">
          <span className="min-w-0 flex-1 capitalize leading-snug">{headerDate}</span>
          <LangToggle />
          <span className="shrink-0 opacity-70">{m.statusAppName}</span>
        </div>

        {/* Header */}
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

        {/* Greeting */}
        <section className="px-5 pb-4">
          <p className="text-[22px] font-medium leading-snug text-[var(--vq-text)]">{greetingText}</p>
          <p className="mt-1 text-sm text-[var(--vq-muted)]">
            {taskDone ? m.subtitleDone : m.subtitlePending}
          </p>
        </section>

        {/* Streak */}
        <section className="relative mx-5 mb-4 overflow-hidden rounded-[20px] bg-[#534AB7] px-5 py-5 text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-[120px] w-[120px] rounded-full bg-white/[0.06]" />
          <div className="pointer-events-none absolute bottom-[-20px] right-10 h-20 w-20 rounded-full bg-white/[0.05]" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide opacity-75">
                {m.streakLabel}
              </p>
              <p className="text-5xl font-medium leading-none">{displayStreak}</p>
              <p className="mt-1 text-sm opacity-80">{m.streakUnit}</p>
            </div>
            <span className="text-5xl leading-none" aria-hidden>
              {moodEmoji}
            </span>
          </div>
          <p className="relative mt-3.5 border-t border-white/20 pt-3.5 text-[13px] leading-snug opacity-85">
            {streakText}
          </p>
          <div className="relative mt-3.5 flex gap-1.5">
            {m.weekLabels.map((label, i) => {
              const kind = weekDots[i];
              const dotClass =
                kind === "done"
                  ? "bg-white/90 text-[#534AB7] font-medium"
                  : kind === "today"
                    ? "bg-[#FAC775] text-[#412402] font-medium"
                    : kind === "missed"
                      ? "bg-white/[0.15] text-white/40"
                      : "bg-white/[0.08] text-white/25";
              const inner =
                kind === "done" ? "✓" : kind === "today" ? "!" : "·";
              return (
                <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] uppercase opacity-65">{label}</span>
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

        {/* Progress */}
        <div className="mb-2 flex justify-between px-5 text-xs text-[var(--vq-muted)]">
          <span>{m.progressToday}</span>
          <span>{m.progressTasks(taskDone ? 1 : 0, 1)}</span>
        </div>
        <div className="mx-5 mb-4 h-2 overflow-hidden rounded-lg bg-[var(--vq-bg-2)]">
          <div
            className="h-full rounded-lg bg-[#534AB7] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mb-2.5 px-5 text-[13px] font-medium uppercase tracking-wide text-[var(--vq-muted)]">
          {m.questToday}
        </p>

        {/* Task */}
        <div className="mx-5 mb-3 flex items-center gap-3.5 rounded-[var(--vq-radius-lg)] border border-[var(--vq-border)] bg-[var(--vq-bg-2)] p-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
              taskDone ? "bg-[#EAF3DE]" : "bg-[#FAEEDA]"
            }`}
          >
            {taskDone ? "✅" : "📖"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-[var(--vq-text)]">{m.taskTitle}</p>
            <p className="mt-0.5 text-xs text-[var(--vq-muted)]">
              {taskDone ? m.taskDescDone : m.taskDescPending}
            </p>
          </div>
          <span
            className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${
              taskDone ? "bg-[#EAF3DE] text-[#27500A]" : "bg-[#FAEEDA] text-[#633806]"
            }`}
          >
            {taskDone ? m.badgeDone : m.badgePending}
          </span>
        </div>

        {/* CTA */}
        <div className="px-5 pb-6">
          <button
            type="button"
            disabled={taskDone}
            onClick={handleOpenSubmit}
            className={`flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl py-4 text-base font-medium transition active:scale-[0.98] ${
              taskDone
                ? "cursor-default bg-[#3B6D11] text-white"
                : "bg-[#534AB7] text-white hover:bg-[#3C3489]"
            }`}
          >
            {taskDone ? (
              m.ctaDone
            ) : (
              <>
                <span>✨</span> {m.ctaSubmit}
              </>
            )}
          </button>

          <div className="mt-4 rounded-[var(--vq-radius-lg)] border border-[var(--vq-border)] bg-[var(--vq-bg-2)] p-4">
            <p className="mb-2 text-[13px] font-medium text-[var(--vq-text)]">{m.scheduleHeading}</p>
            {todaySchedule ? (
              <div>
                <div className="space-y-1">
                  <p className="text-[15px] font-semibold text-[var(--vq-text)]">
                    {bookDisplayName(todaySchedule.book, locale)}
                  </p>
                  <p className="text-sm leading-snug text-[var(--vq-muted)]">{todaySchedule.reading}</p>
                </div>

                {schedulePassageStatus === "loading" && (
                  <p className="mt-3 text-sm text-[var(--vq-muted)]">{m.scheduleLoadingPassage}</p>
                )}
                {schedulePassageStatus === "error" && (
                  <p className="mt-3 text-sm text-red-700">{m.schedulePassageError}</p>
                )}
                {schedulePassageStatus === "ok" && schedulePassage && schedulePassage.length > 0 && (
                  <div className="mt-3 max-h-[min(50vh,360px)] overflow-y-auto border-t border-[var(--vq-border)] pt-3">
                    <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-[var(--vq-muted)]">
                      {m.scheduleTranslationNote}
                    </p>
                    {schedulePassage.map((row, i) => {
                      const rowKey = scheduleVerseKey(row);
                      const selected = scheduleVerseSelectedKey === rowKey;
                      return (
                        <div key={rowKey}>
                          {(i === 0 || schedulePassage[i - 1].chapter !== row.chapter) && (
                            <p className="mb-1.5 mt-2 first:mt-0 text-xs font-semibold text-[var(--vq-muted)]">
                              {m.scheduleChapterHeading(row.chapter)}
                            </p>
                          )}
                          <div className="mb-2.5 flex items-start gap-2 last:mb-0">
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
                            {selected && (
                              <button
                                type="button"
                                onClick={() => void copyScheduleVerseToClipboard(row)}
                                className="touch-manipulation shrink-0 rounded-lg border border-[#AFA9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#534AB7] shadow-sm transition hover:bg-[#EEEDFE] active:scale-[0.98]"
                                aria-label={m.scheduleVerseCopyAria}
                              >
                                {scheduleVerseCopiedKey === rowKey ? m.scheduleVerseCopied : m.scheduleCopyVerse}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm leading-snug text-[var(--vq-muted)]">{m.scheduleNoPlan}</p>
            )}
          </div>
        </div>

        <VerseModal
          key={verseModalKey}
          open={verseOpen}
          onClose={() => setVerseOpen(false)}
          readingConstraint={readingConstraint}
          onSubmit={handleSubmitVerse}
        />

        {successOpen && (
          <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center rounded-[var(--vq-radius-xl)] bg-black/60 p-10 text-center animate-vq-fade-in">
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
          </div>
        )}
      </div>
    </div>
  );
}
