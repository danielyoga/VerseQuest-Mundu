"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTodayString } from "@/lib/sheetName";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";

export default function DevotionalPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const m = messages[locale];

  const todayStr = getTodayString();
  const devotionKey = `versequest_devotion_${todayStr}`;

  const [devotion, setDevotion] = useState<string | null>(null);
  const [devotionTitle, setDevotionTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/devotion/today", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { devotion?: string | null; devotionTitle?: string | null }) => {
        setDevotion(d.devotion ?? null);
        setDevotionTitle(d.devotionTitle ?? null);
      })
      .catch(() => setDevotion(null))
      .finally(() => setLoading(false));
  }, []);

  function markAsRead() {
    localStorage.setItem(devotionKey, "read");
    window.dispatchEvent(new StorageEvent("storage", { key: devotionKey, newValue: "read", storageArea: localStorage }));
    router.back();
  }

  const dateLabel = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vq-canvas)] text-[var(--vq-muted)]">
        {m.devotionLoadingText}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--vq-canvas)] px-4 pb-32 pt-8">
      <div className="mx-auto max-w-[390px]">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--vq-muted)] hover:bg-[var(--vq-bg-2)]"
              aria-label={m.devotionBackAria}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M11 14l-5-5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-[13px] text-[var(--vq-muted)]">{dateLabel}</span>
          </div>
          <h1 className="text-2xl font-medium text-[var(--vq-text)]">📖 {m.devotionNavTitle}</h1>
        </div>

        {/* Devotion text */}
        {devotion ? (
          <div className="mb-6 rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)] p-6">
            {devotionTitle && (
              <p className="mb-3 text-xl font-bold text-[var(--vq-text)]">{devotionTitle}</p>
            )}
            <p className="whitespace-pre-wrap break-words leading-[1.8] text-[15px] text-[var(--vq-text)]">
              {devotion}
            </p>
          </div>
        ) : (
          <div className="mb-6 rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)] p-6">
            <p className="text-[var(--vq-muted)]">{m.devotionUnavailable}</p>
          </div>
        )}

        {/* Mark as read button */}
        <button
          type="button"
          onClick={markAsRead}
          disabled={!devotion}
          className="w-full min-h-[52px] rounded-2xl bg-[#534AB7] py-4 text-base font-medium text-white transition hover:bg-[#3C3489] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {m.devotionMarkRead}
        </button>
      </div>
    </div>
  );
}
