"use client";

import { useEffect, useRef, useState } from "react";
import { AppSettingsButton } from "@/components/AppSettingsButton";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import { normalizePhone, normalizePhoneDraftForDisplay } from "@/lib/preregister";
import { getRantingList } from "@/lib/constants";

/** Styled dropdown that matches the existing input design language. */
function RantingDropdown({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[48px] w-full items-center justify-between rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 text-base text-[var(--vq-text)] transition-colors hover:border-[#534AB7]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#534AB7]/40"
      >
        <span>Ranting {value}</span>
        <svg
          className={`ml-2 shrink-0 text-[var(--vq-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          aria-hidden
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-64 touch-pan-y overflow-y-auto rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg)] shadow-lg"
        >
          {options.map((opt) => {
            const selected = opt === value;
            return (
              <li
                key={opt}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={[
                  "flex cursor-pointer items-center gap-2 px-3.5 py-3 text-base transition-colors",
                  selected
                    ? "bg-[#534AB7]/8 font-medium text-[#534AB7]"
                    : "text-[var(--vq-text)] hover:bg-[var(--vq-bg-2)]",
                ].join(" ")}
              >
                {selected && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {!selected && <span className="w-[14px]" />}
                Ranting {opt}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type Props = {
  registerProfile: (
    phoneInput: string,
    ranting?: string
  ) => Promise<{ ok: boolean; error?: string }>;
};

export function PhoneRegistrationScreen({ registerProfile }: Props) {
  const { locale } = useLocale();
  const m = messages[locale];
  const [phoneDraft, setPhoneDraft] = useState("");
  const canonicalPhoneDraft = normalizePhone(phoneDraft);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const rantingList = getRantingList();
  const showRantingDropdown = rantingList.length > 0;
  const [ranting, setRanting] = useState(rantingList[0] ?? "");

  const canSubmit =
    !registerSubmitting &&
    !!canonicalPhoneDraft &&
    canonicalPhoneDraft.length >= 10 &&
    (!showRantingDropdown || !!ranting);

  useEffect(() => {
    phoneInputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen overflow-y-auto bg-[var(--vq-canvas)] px-4 py-12">
      <div className="mx-auto flex max-w-[390px] flex-col items-center rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)] p-8 shadow-sm">
        <div className="mb-4 flex w-full flex-row items-center justify-end">
          <AppSettingsButton />
        </div>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[10px] bg-[#534AB7] text-2xl text-white">
          📖
        </div>
        <h1 className="text-center text-2xl font-medium text-[var(--vq-text)]">{m.loginTitle}</h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-[var(--vq-muted)]">
          {m.loginSubtitle}
        </p>
        <form
          id="vq-register-phone"
          className="mt-8 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            void (async () => {
              setRegisterSubmitting(true);
              try {
                setPhoneDraft(normalizePhoneDraftForDisplay(canonicalPhoneDraft));
                const r = await registerProfile(
                  canonicalPhoneDraft,
                  showRantingDropdown ? ranting : undefined
                );
                if (!r.ok) {
                  setRegisterError(r.error ?? m.loginErrorGeneric);
                  return;
                }
                setRegisterError(null);
              } finally {
                setRegisterSubmitting(false);
              }
            })();
          }}
        >
          <label className="block w-full">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
              {m.loginPhoneLabel}
            </span>
            <div className="flex gap-2">
              <span className="flex w-[72px] shrink-0 items-center justify-center rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] text-[15px] text-[var(--vq-text)]">
                +62
              </span>
              <input
                ref={phoneInputRef}
                type="tel"
                name="phone"
                inputMode="numeric"
                autoComplete="tel"
                value={phoneDraft}
                onChange={(e) => {
                  setRegisterError(null);
                  setPhoneDraft(e.target.value.replace(/\D/g, ""));
                }}
                onBlur={() => {
                  setPhoneDraft((prev) => normalizePhoneDraftForDisplay(prev));
                }}
                placeholder="81234567890"
                className="min-h-[48px] min-w-0 flex-1 rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 text-base text-[var(--vq-text)]"
              />
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-[var(--vq-muted-2)]">
              {m.loginCountryHint}
            </p>
          </label>

          {showRantingDropdown && (
            <div className="mt-4 w-full">
              <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
                {m.loginRantingLabel}
              </span>
              <RantingDropdown
                value={ranting}
                options={rantingList}
                label={m.loginRantingLabel}
                onChange={(v) => {
                  setRegisterError(null);
                  setRanting(v);
                }}
              />
            </div>
          )}

          {registerError && (
            <p className="mt-3 w-full rounded-lg bg-red-50 px-3 py-2 text-[13px] leading-snug text-red-800">
              {registerError}
            </p>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 w-full min-h-[52px] rounded-2xl bg-[#534AB7] py-4 text-base font-medium text-white transition hover:bg-[#3C3489] disabled:cursor-not-allowed disabled:bg-[var(--vq-bg-2)] disabled:text-[var(--vq-muted-2)]"
          >
            {registerSubmitting ? m.loading : m.loginContinue}
          </button>
        </form>
      </div>
    </div>
  );
}
