"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { messages, type Locale } from "@/lib/i18n";

export function LangToggle() {
  const { locale, setLocale } = useLocale();
  const m = messages[locale];

  const options: { code: Locale; label: string }[] = [
    { code: "en", label: m.langShortEn },
    { code: "id", label: m.langShortId },
  ];

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-[var(--vq-border)] bg-[var(--vq-bg-2)] p-0.5"
      role="group"
      aria-label={m.langAria}
    >
      {options.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`min-h-[36px] min-w-[40px] rounded-full px-3 text-xs font-semibold transition touch-manipulation ${
            locale === code
              ? "bg-[#534AB7] text-white"
              : "text-[var(--vq-muted)] hover:bg-[var(--vq-bg-2)]"
          }`}
          aria-pressed={locale === code}
          aria-label={`${m.langAria}: ${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
