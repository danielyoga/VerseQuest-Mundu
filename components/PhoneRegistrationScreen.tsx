"use client";

import { useEffect, useRef, useState } from "react";
import { AppSettingsButton } from "@/components/AppSettingsButton";
import { GCross } from "@/components/ui/Glyphs";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import { normalizePhone, normalizePhoneDraftForDisplay } from "@/lib/preregister";
import { getRantingList } from "@/lib/constants";

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
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          minHeight: 48,
          padding: "12px 14px",
          borderRadius: "var(--radius-md)",
          border: "1.5px solid var(--color-border)",
          background: "#FAFAFF",
          color: "var(--color-text-primary)",
          fontSize: 15,
          fontFamily: "var(--font-body)",
          cursor: "pointer",
          transition: "border-color 0.12s ease, box-shadow 0.12s ease",
          boxSizing: "border-box",
        }}
      >
        <span>{label}: {value}</span>
        <svg
          style={{
            marginLeft: 8,
            flexShrink: 0,
            color: "var(--color-text-muted)",
            transition: "transform 150ms",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
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
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 4px)",
            zIndex: 20,
            maxHeight: "min(280px, 45vh)",
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            borderRadius: "var(--radius-md)",
            border: "1.5px solid var(--color-border)",
            background: "var(--color-bg-card)",
            boxShadow: "var(--shadow-modal)",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {options.map((opt) => {
            const selected = opt === value;
            return (
              <li
                key={opt}
                role="option"
                aria-selected={selected}
                onPointerDown={(e) => {
                  e.preventDefault();
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 14px",
                  fontSize: 15,
                  cursor: "pointer",
                  color: selected ? "var(--color-primary)" : "var(--color-text-primary)",
                  background: selected ? "rgba(83,74,183,0.06)" : "transparent",
                  fontWeight: selected ? 600 : 400,
                  fontFamily: "var(--font-body)",
                  transition: "background 0.1s ease",
                }}
              >
                {selected ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span style={{ width: 14, display: "inline-block" }} />
                )}
                {opt}
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: "var(--color-bg-page)", position: "relative" }}>
      <div className="vq-grain" />

      {/* Scrollable content */}
      <div style={{ flex: 1, padding: "60px 28px 0", position: "relative" }}>

        {/* Settings + logo row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "var(--color-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <GCross size={22} color="#fff" />
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700,
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-display)",
            }}>
              Verse<span style={{ color: "var(--color-primary)" }}>Quest</span>
            </div>
          </div>
          <AppSettingsButton />
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: 30, fontWeight: 700,
          color: "var(--color-text-primary)",
          lineHeight: 1.18, margin: "8px 0 8px",
          letterSpacing: "-0.02em",
        }}>
          {m.loginTitle}
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--color-text-secondary)", lineHeight: 1.55, margin: 0 }}>
          {m.loginSubtitle}
        </p>

        <form
          id="vq-register-phone"
          style={{ marginTop: 28 }}
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
          <label style={{ display: "block" }}>
            <span style={{
              display: "block", marginBottom: 8,
              fontSize: 12, fontWeight: 700,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              {m.loginPhoneLabel}
            </span>
            <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6, padding: "0 12px",
                border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)",
                background: "#FAFAFF", color: "var(--color-text-primary)",
                fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", flexShrink: 0,
              }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>🇮🇩</span>
                <span>+62</span>
              </div>
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
                style={{
                  flex: 1, minWidth: 0,
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  background: "#FAFAFF",
                  color: "var(--color-text-primary)",
                  fontSize: 15,
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  transition: "border-color 0.12s ease, box-shadow 0.12s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.boxShadow = "var(--shadow-active)";
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-muted)" }}>
              {m.loginCountryHint}
            </p>
          </label>

          {showRantingDropdown && (
            <div style={{ marginTop: 16 }}>
              <span style={{
                display: "block", marginBottom: 8,
                fontSize: 12, fontWeight: 700,
                color: "var(--color-text-secondary)",
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
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
            <div style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-danger-border)",
              fontSize: 13, lineHeight: 1.5,
              color: "var(--color-danger-text)",
            }}>
              {registerError}
            </div>
          )}
        </form>
      </div>

      {/* Fixed bottom CTA */}
      <div style={{ padding: "12px 28px 32px", flexShrink: 0 }}>
        <button
          type="submit"
          form="vq-register-phone"
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: "var(--radius-md)",
            background: canSubmit ? "var(--color-primary)" : "var(--color-primary-border)",
            color: "#fff",
            fontSize: 15, fontWeight: 700,
            fontFamily: "var(--font-body)",
            border: "none",
            cursor: canSubmit ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, minHeight: 48,
            transition: "all 0.12s ease",
          }}
        >
          {registerSubmitting ? m.loading : m.loginContinue}
        </button>
      </div>
    </div>
  );
}
