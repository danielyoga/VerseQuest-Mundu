"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  initialItems: [string, string, string];
  onSubmit: (items: [string, string, string]) => void;
};

export function GratitudeModal({
  open,
  onClose,
  initialItems,
  onSubmit,
}: Props) {
  const { locale } = useLocale();
  const m = messages[locale];
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [portalReady, setPortalReady] = useState(false);

  useLayoutEffect(() => {
    // Client-only: portal target must exist (match FirmanPollModal pattern).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time after mount
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset drafts when modal opens
    setA(initialItems[0] ?? "");
    setB(initialItems[1] ?? "");
    setC(initialItems[2] ?? "");
  }, [open, initialItems]);

  const canSubmit =
    a.trim().length > 0 && b.trim().length > 0 && c.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit([a.trim(), b.trim(), c.trim()]);
  }

  if (!open) return null;

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      style={{ minHeight: "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gratitude-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(85vh,640px)] w-full max-w-[min(100%,390px)] flex-col overflow-hidden rounded-[24px] bg-[var(--vq-bg)] shadow-xl animate-vq-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--vq-border)] px-5 py-4">
          <div className="min-w-0 pr-2">
            <h2
              id="gratitude-modal-title"
              className="text-lg font-medium leading-snug text-[var(--vq-text)]"
            >
              {m.gratitudeModalTitle}
            </h2>
            <p className="mt-0.5 text-[13px] leading-snug text-[var(--vq-muted)]">
              {m.gratitudeModalSubtitle}
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
            {m.gratitudeModalHint}
          </p>
          <div className="flex flex-col gap-3">
            {[m.gratitudeField1, m.gratitudeField2, m.gratitudeField3].map(
              (label, i) => {
                const value = i === 0 ? a : i === 1 ? b : c;
                const set =
                  i === 0 ? setA : i === 1 ? setB : setC;
                return (
                  <label
                    key={label}
                    className="flex w-full flex-col gap-1.5 rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] p-3.5"
                  >
                    <span className="text-[12px] font-medium text-[var(--vq-muted)]">
                      {label}
                    </span>
                    <textarea
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      rows={2}
                      className="min-h-[52px] w-full resize-y rounded-lg border border-[var(--vq-border)] bg-[var(--vq-bg)] px-3 py-2.5 text-[14px] leading-snug text-[var(--vq-text)] placeholder:text-[var(--vq-muted-2)] focus:border-[#534AB7] focus:outline-none focus:ring-1 focus:ring-[#534AB7]"
                      placeholder={m.gratitudePlaceholder}
                    />
                  </label>
                );
              }
            )}
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="mt-5 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#534AB7] py-[15px] text-base font-medium text-white transition hover:bg-[#3C3489] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[var(--vq-bg-2)] disabled:text-[var(--vq-muted-2)]"
          >
            <span>✨</span> {m.gratitudeSubmit}
          </button>
        </div>
      </div>
    </div>
  );

  if (!portalReady) return null;
  return createPortal(overlay, document.body);
}
