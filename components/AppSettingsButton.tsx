"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDisplayOrder } from "@/contexts/DisplayOrderContext";
import { useLocale } from "@/contexts/LocaleContext";
import type { DisplayOrder } from "@/lib/display-order";
import { messages, type Locale } from "@/lib/i18n";
import { clearSession } from "@/lib/session";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";

function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppSettingsButton() {
  const { locale, setLocale } = useLocale();
  const { displayOrder, setDisplayOrder } = useDisplayOrder();
  const m = messages[locale];
  const [open, setOpen] = useState(false);

  const handleSignOut = () => {
    clearSession();
    localStorage.removeItem(APP_DATA_STORAGE_KEY);
    // Hard reload so all React state (streak, XP) is fully reset
    window.location.href = "/";
  };
  const [portalReady, setPortalReady] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const langOptions: { code: Locale; label: string }[] = [
    { code: "en", label: m.langShortEn },
    { code: "id", label: m.langShortId },
  ];

  const orderOptions: { value: DisplayOrder; label: string }[] = [
    { value: "missions_first", label: m.displayOrderMissionsFirst },
    { value: "reading_first", label: m.displayOrderReadingFirst },
  ];

  useEffect(() => {
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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--vq-border)] bg-[var(--vq-bg-2)] text-[var(--vq-muted)] transition hover:bg-[var(--vq-bg)] hover:text-[var(--vq-text)] touch-manipulation"
        aria-label={m.settingsAria}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
      >
        <GearIcon className="h-5 w-5" />
      </button>

      {open &&
        portalReady &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center sm:p-6 animate-vq-fade-in"
            style={{ minHeight: "100dvh" }}
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="w-full max-w-[360px] rounded-2xl border border-[var(--vq-border)] bg-[var(--vq-bg)] p-5 shadow-xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h2
                id={titleId}
                className="text-lg font-semibold text-[var(--vq-text)]"
              >
                {m.settingsTitle}
              </h2>

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--vq-muted)]">
                  {m.settingsLanguageSection}
                </p>
                <div
                  className="flex gap-0.5 rounded-full border border-[var(--vq-border)] bg-[var(--vq-bg-2)] p-0.5"
                  role="group"
                  aria-label={m.langAria}
                >
                  {langOptions.map(({ code, label }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLocale(code)}
                      className={`min-h-[40px] min-w-0 flex-1 rounded-full px-3 text-xs font-semibold transition touch-manipulation ${
                        locale === code
                          ? "bg-[#534AB7] text-white"
                          : "text-[var(--vq-muted)] hover:bg-[var(--vq-bg-2)]"
                      }`}
                      aria-pressed={locale === code}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--vq-muted)]">
                  {m.settingsDisplayOrderSection}
                </p>
                <p className="mb-3 text-xs leading-relaxed text-[var(--vq-muted)]">
                  {m.settingsDisplayOrderHint}
                </p>
                <div
                  className="flex flex-col gap-2"
                  role="radiogroup"
                  aria-label={m.settingsDisplayOrderSection}
                >
                  {orderOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={displayOrder === value}
                      onClick={() => setDisplayOrder(value)}
                      className={`flex min-h-[48px] w-full items-center rounded-xl border px-3.5 text-left text-sm font-medium transition touch-manipulation ${
                        displayOrder === value
                          ? "border-[#534AB7] bg-[#EEEDFE] text-[#534AB7]"
                          : "border-[var(--vq-border)] bg-[var(--vq-bg-2)] text-[var(--vq-text)] hover:bg-[var(--vq-bg)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="mt-6 w-full min-h-[44px] rounded-2xl border border-[var(--vq-border)] py-2.5 text-sm font-medium text-[var(--vq-muted)] transition hover:border-red-300 hover:text-red-500"
              >
                {m.settingsSignOut}
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 w-full min-h-[48px] rounded-2xl bg-[#534AB7] py-3 text-base font-medium text-white transition hover:bg-[#3C3489]"
              >
                {m.settingsDone}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
