"use client";

import { useMemo, useState } from "react";
import { useVerseQuest } from "@/hooks/useVerseQuest";
import { VerseModal } from "@/components/VerseModal";
import { greetingPeriod, id } from "@/lib/i18n-id";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function formatTodayId(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function VerseQuestApp() {
  const {
    hydrated,
    state,
    displayStreak,
    submittedToday,
    weekDots,
    moodEmoji,
    streakMessage,
    registerProfile,
    submitVerse,
  } = useVerseQuest();

  const [phoneDraft, setPhoneDraft] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [verseOpen, setVerseOpen] = useState(false);
  const [verseModalKey, setVerseModalKey] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);

  const progress = submittedToday ? 100 : 0;
  const taskDone = submittedToday;

  const displayName = state.profile.name || "Anda";

  const headerDate = useMemo(() => formatTodayId(new Date()), []);

  const greetingLine = useMemo(() => {
    const h = new Date().getHours();
    return id.greeting(greetingPeriod(h), displayName);
  }, [displayName]);

  function handleOpenSubmit() {
    if (taskDone) return;
    setVerseModalKey((k) => k + 1);
    setVerseOpen(true);
  }

  function handleSubmitVerse(data: Parameters<typeof submitVerse>[0]) {
    const r = submitVerse(data);
    if (!r.ok) {
      window.alert(r.error ?? id.errSubmitGeneric);
      return;
    }
    setVerseOpen(false);
    window.setTimeout(() => setSuccessOpen(true), 200);
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vq-canvas)] text-[var(--vq-muted)]">
        {id.loading}
      </div>
    );
  }

  if (!state.profile.name || !state.profile.phone) {
    return (
      <div className="min-h-screen bg-[var(--vq-canvas)] px-4 py-12">
        <div className="mx-auto flex max-w-[390px] flex-col items-center rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)] p-8 shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[10px] bg-[#534AB7] text-2xl text-white">
            📖
          </div>
          <h1 className="text-center text-2xl font-medium text-[var(--vq-text)]">{id.loginTitle}</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-[var(--vq-muted)]">
            {id.loginSubtitle}
          </p>
          <label className="mt-8 w-full">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
              {id.loginPhoneLabel}
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
              {id.loginCountryHint}
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
                setRegisterError(r.error ?? id.loginErrorGeneric);
                return;
              }
              setRegisterError(null);
            }}
            className="mt-6 w-full min-h-[52px] rounded-2xl bg-[#534AB7] py-4 text-base font-medium text-white transition hover:bg-[#3C3489] disabled:cursor-not-allowed disabled:bg-[var(--vq-bg-2)] disabled:text-[var(--vq-muted-2)]"
          >
            {id.loginContinue}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--vq-canvas)] py-6">
      <div className="relative mx-auto flex min-h-[780px] max-w-[390px] flex-col overflow-hidden rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)]">
        {/* Tanggal hari ini */}
        <div className="flex items-center justify-between px-5 pb-1.5 pt-3 text-xs font-medium text-[var(--vq-muted)]">
          <span className="max-w-[70%] capitalize leading-snug">{headerDate}</span>
          <span className="opacity-70">{id.statusAppName}</span>
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
            title={id.profileTitle}
          >
            {initials(displayName)}
          </div>
        </header>

        {/* Sapaan */}
        <section className="px-5 pb-4">
          <p className="text-[22px] font-medium leading-snug text-[var(--vq-text)]">{greetingLine}</p>
          <p className="mt-1 text-sm text-[var(--vq-muted)]">
            {taskDone ? id.subtitleDone : id.subtitlePending}
          </p>
        </section>

        {/* Streak */}
        <section className="relative mx-5 mb-4 overflow-hidden rounded-[20px] bg-[#534AB7] px-5 py-5 text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-[120px] w-[120px] rounded-full bg-white/[0.06]" />
          <div className="pointer-events-none absolute bottom-[-20px] right-10 h-20 w-20 rounded-full bg-white/[0.05]" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide opacity-75">
                {id.streakLabel}
              </p>
              <p className="text-5xl font-medium leading-none">{displayStreak}</p>
              <p className="mt-1 text-sm opacity-80">{id.streakUnit}</p>
            </div>
            <span className="text-5xl leading-none" aria-hidden>
              {moodEmoji}
            </span>
          </div>
          <p className="relative mt-3.5 border-t border-white/20 pt-3.5 text-[13px] leading-snug opacity-85">
            {streakMessage}
          </p>
          <div className="relative mt-3.5 flex gap-1.5">
            {id.weekLabels.map((label, i) => {
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
          <span>{id.progressToday}</span>
          <span>{id.progressTasks(taskDone ? 1 : 0, 1)}</span>
        </div>
        <div className="mx-5 mb-4 h-2 overflow-hidden rounded-lg bg-[var(--vq-bg-2)]">
          <div
            className="h-full rounded-lg bg-[#534AB7] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mb-2.5 px-5 text-[13px] font-medium uppercase tracking-wide text-[var(--vq-muted)]">
          {id.questToday}
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
            <p className="text-[15px] font-medium text-[var(--vq-text)]">{id.taskTitle}</p>
            <p className="mt-0.5 text-xs text-[var(--vq-muted)]">
              {taskDone ? id.taskDescDone : id.taskDescPending}
            </p>
          </div>
          <span
            className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${
              taskDone ? "bg-[#EAF3DE] text-[#27500A]" : "bg-[#FAEEDA] text-[#633806]"
            }`}
          >
            {taskDone ? id.badgeDone : id.badgePending}
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
              id.ctaDone
            ) : (
              <>
                <span>✨</span> {id.ctaSubmit}
              </>
            )}
          </button>
        </div>

        <VerseModal
          key={verseModalKey}
          open={verseOpen}
          onClose={() => setVerseOpen(false)}
          onSubmit={handleSubmitVerse}
        />

        {successOpen && (
          <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center rounded-[var(--vq-radius-xl)] bg-black/60 p-10 text-center animate-vq-fade-in">
            <div className="w-full max-w-[320px] rounded-3xl bg-[var(--vq-bg)] px-7 py-8 shadow-xl">
              <div className="mb-4 text-[56px] animate-vq-bounce-in">🎉</div>
              <h3 className="mb-2 text-[22px] font-medium text-[var(--vq-text)]">{id.successTitle}</h3>
              <p className="mb-5 text-sm leading-relaxed text-[var(--vq-muted)]">
                {id.successBody(displayName)}
              </p>
              <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[#534AB7] px-5 py-2 text-sm font-medium text-white">
                <span>⭐</span> {id.successXp}
              </div>
              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="w-full min-h-[52px] rounded-2xl bg-[#534AB7] py-3.5 text-base font-medium text-white hover:bg-[#3C3489]"
              >
                {id.successCta}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
