"use client";

import { useEffect, useRef, useState } from "react";
import { AppSettingsButton } from "@/components/AppSettingsButton";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import { normalizePhone, normalizePhoneDraftForDisplay } from "@/lib/preregister";

type Props = {
  registerProfile: (
    phoneInput: string
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

  useEffect(() => {
    phoneInputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--vq-canvas)] px-4 py-12">
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
            if (
              registerSubmitting ||
              !canonicalPhoneDraft ||
              canonicalPhoneDraft.length < 10
            ) {
              return;
            }
            void (async () => {
              setRegisterSubmitting(true);
              try {
                setPhoneDraft(normalizePhoneDraftForDisplay(canonicalPhoneDraft));
                const r = await registerProfile(canonicalPhoneDraft);
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
          {registerError && (
            <p className="mt-3 w-full rounded-lg bg-red-50 px-3 py-2 text-[13px] leading-snug text-red-800">
              {registerError}
            </p>
          )}
          <button
            type="submit"
            disabled={
              registerSubmitting ||
              !canonicalPhoneDraft ||
              canonicalPhoneDraft.length < 10
            }
            className="mt-6 w-full min-h-[52px] rounded-2xl bg-[#534AB7] py-4 text-base font-medium text-white transition hover:bg-[#3C3489] disabled:cursor-not-allowed disabled:bg-[var(--vq-bg-2)] disabled:text-[var(--vq-muted-2)]"
          >
            {registerSubmitting ? m.loading : m.loginContinue}
          </button>
        </form>
      </div>
    </div>
  );
}
