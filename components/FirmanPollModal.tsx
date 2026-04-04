"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/contexts/LocaleContext";
import {
  type FirmanPollConfig,
  localizedOptional,
  questionLabel,
} from "@/lib/firman-poll-config";
import { messages } from "@/lib/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  config: FirmanPollConfig;
  initialAnswers: Record<string, boolean>;
  onSubmit: (answers: Record<string, boolean>) => void;
};

type Question = { id: string; label: string };

export function FirmanPollModal({
  open,
  onClose,
  config,
  initialAnswers,
  onSubmit,
}: Props) {
  const { locale } = useLocale();
  const m = messages[locale];
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [portalReady, setPortalReady] = useState(false);
  // Questions resolved from config or sheet fallback
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingFallback, setLoadingFallback] = useState(false);

  const noQuestions = config.questions.length === 0;

  useLayoutEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Build questions list from config or fetch from sheet
  useEffect(() => {
    if (!open) return;

    if (!noQuestions) {
      const qs: Question[] = config.questions.map((q) => ({
        id: q.id,
        label: questionLabel(q, locale),
      }));
      setQuestions(qs);
      // Restore saved answers
      const next: Record<string, boolean> = {};
      for (const q of config.questions) next[q.id] = Boolean(initialAnswers[q.id]);
      setAnswers(next);
      return;
    }

    // No config — fetch yesterday's reflection from the sheet
    setLoadingFallback(true);
    void fetch("/api/devotion/reflection", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { reflection?: string[] }) => {
        const items = d.reflection ?? [];
        const qs: Question[] = items.map((text, i) => ({ id: `sheet-${i}`, label: text }));
        setQuestions(qs);
        // Restore saved answers keyed by sheet-index ids
        const next: Record<string, boolean> = {};
        for (const q of qs) next[q.id] = Boolean(initialAnswers[q.id]);
        setAnswers(next);
      })
      .catch(() => setQuestions([]))
      .finally(() => setLoadingFallback(false));
  }, [open, noQuestions, config.questions, initialAnswers, locale]);

  const title = localizedOptional(config.title, locale, m.firmanModalTitleDefault);
  const subtitle = localizedOptional(config.subtitle, locale, m.firmanModalSubtitleDefault);

  function toggle(id: string) {
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSubmit() {
    onSubmit({ ...answers });
  }

  if (!open) return null;

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      style={{ minHeight: "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="firman-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(85vh,640px)] w-full max-w-[min(100%,390px)] flex-col overflow-hidden rounded-[24px] bg-[var(--vq-bg)] shadow-xl animate-vq-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--vq-border)] px-5 py-4">
          <div className="min-w-0 pr-2">
            <h2
              id="firman-modal-title"
              className="text-lg font-medium leading-snug text-[var(--vq-text)]"
            >
              {title}
            </h2>
            <p className="mt-0.5 text-[13px] leading-snug text-[var(--vq-muted)]">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-[var(--vq-bg-2)] text-[var(--vq-muted)]"
            aria-label={m.modalClose}
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-wide text-[var(--vq-muted)]">
            {m.firmanModalCheckAllHint}
          </p>

          {loadingFallback ? (
            <p className="py-6 text-center text-sm text-[var(--vq-muted)]">{m.loading}</p>
          ) : questions.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--vq-muted)]">
              {m.firmanPollConfigMissing}
            </p>
          ) : (
            <>
              <div className="flex w-full flex-col gap-3">
                {questions.map((q) => {
                  const checked = Boolean(answers[q.id]);
                  return (
                    <label
                      key={q.id}
                      className={`flex w-full cursor-pointer gap-3 rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] p-3.5 transition-colors ${
                        checked
                          ? "border-[#E8D4A8] bg-[#FAEEDA]/90"
                          : "hover:border-[var(--vq-border)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(q.id)}
                        className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[#534AB7]"
                      />
                      <span className="min-w-0 flex-1 text-[14px] leading-snug text-[var(--vq-text)]">
                        {q.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="mt-5 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#534AB7] py-[15px] text-base font-medium text-white transition hover:bg-[#3C3489] active:scale-[0.98]"
              >
                <span>🔥</span> {m.firmanSubmitPoll}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (!portalReady) return null;
  return createPortal(overlay, document.body);
}
