"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDisplayOrder } from "@/contexts/DisplayOrderContext";
import { useDisplayPrefs } from "@/contexts/DisplayPrefsContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { DisplayOrder } from "@/lib/display-order";
import type { Density } from "@/lib/display-prefs";
import { messages, type Locale } from "@/lib/i18n";
import { clearSession } from "@/lib/session";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { clearScheduleWindowCache } from "@/lib/schedule/window-cache";

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Reusable segmented control
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="flex gap-0.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-0.5"
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map(({ value: v, label }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`min-h-[36px] flex-1 rounded-[10px] px-3 text-xs font-semibold transition touch-manipulation ${
            value === v
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
      {children}
    </p>
  );
}

export function AppSettingsButton() {
  const { locale, setLocale } = useLocale();
  const { displayOrder, setDisplayOrder } = useDisplayOrder();
  const { density, setDensity } = useDisplayPrefs();
  const { preference, setPreference } = useTheme();

  const displayModeOptions: { value: Density; label: string }[] = [
    { value: "compact", label: "Compact" },
    { value: "regular", label: "Casual" },
  ];
  const m = messages[locale];
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const handleSignOut = () => {
    clearSession();
    localStorage.removeItem(APP_DATA_STORAGE_KEY);
    clearScheduleWindowCache();
    window.location.href = "/";
  };

  useEffect(() => { setPortalReady(true); }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
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

  const langOptions: { code: Locale; label: string }[] = [
    { code: "en", label: m.langShortEn },
    { code: "id", label: m.langShortId },
  ];

  const orderOptions: { value: DisplayOrder; label: string }[] = [
    { value: "missions_first", label: m.displayOrderMissionsFirst },
    { value: "reading_first", label: m.displayOrderReadingFirst },
  ];
  const themeOptions: { value: "system" | "light" | "dark"; label: string }[] = [
    { value: "system", label: m.settingsThemeSystem },
    { value: "light", label: m.settingsThemeLight },
    { value: "dark", label: m.settingsThemeDark },
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)] touch-manipulation"
        aria-label={m.settingsAria}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
      >
        <GearIcon className="h-5 w-5" />
      </button>

      {open && portalReady && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center sm:p-6 animate-vq-fade-in"
          style={{ minHeight: "100dvh" }}
          role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-[380px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="mb-5 text-lg font-bold text-[var(--color-text-primary)]">
              {m.settingsTitle}
            </h2>

            {/* Language */}
            <div className="mb-5">
              <SectionLabel>{m.settingsLanguageSection}</SectionLabel>
              <SegmentedControl
                options={langOptions.map(({ code, label }) => ({ value: code, label }))}
                value={locale}
                onChange={setLocale}
                ariaLabel={m.langAria}
              />
            </div>

            {/* Home screen order */}
            <div className="mb-5">
              <SectionLabel>{m.settingsDisplayOrderSection}</SectionLabel>
              <p className="mb-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                {m.settingsDisplayOrderHint}
              </p>
              <SegmentedControl
                options={orderOptions}
                value={displayOrder}
                onChange={setDisplayOrder}
                ariaLabel={m.settingsDisplayOrderSection}
              />
            </div>

            {/* Theme mode */}
            <div className="mb-5">
              <SectionLabel>{m.settingsThemeSection}</SectionLabel>
              <SegmentedControl
                options={themeOptions}
                value={preference}
                onChange={setPreference}
                ariaLabel={m.settingsThemeSection}
              />
            </div>

            {/* Display mode */}
            <div className="mb-5">
              <SectionLabel>Tampilan</SectionLabel>
              <SegmentedControl
                options={displayModeOptions}
                value={density}
                onChange={setDensity}
                ariaLabel="Tampilan"
              />
            </div>

            {/* Sign out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-1 w-full min-h-[44px] rounded-2xl border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition hover:border-red-300 hover:text-red-500"
            >
              {m.settingsSignOut}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 w-full min-h-[48px] rounded-2xl bg-[var(--color-primary)] py-3 text-base font-medium text-white transition hover:bg-[#3C3489]"
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
