"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import { SongActionBar } from "@/components/SongActionBar";
import { usePageSong } from "@/hooks/usePageSong";
import { fetchDevotionToday } from "@/lib/client/fetch-devotion-today";
import { getTodayString } from "@/lib/sheetName";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";

const DEVOTIONAL_SONG_SRC = "/audio/devotional-shout-to-the-lord.mp3";
/** "off" once the user pauses the song, so it doesn't start by itself on later visits. */
const MUSIC_PREF_KEY = "vq_devotional_music";

export default function DevotionalPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const m = messages[locale];

  const todayStr = getTodayString();
  const devotionKey = `versequest_devotion_${todayStr}`;

  const [devotion, setDevotion] = useState<string | null>(null);
  const [devotionTitle, setDevotionTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { audioRef: songRef, playing: songPlaying, toggle: toggleSong } = usePageSong(MUSIC_PREF_KEY);

  useEffect(() => {
    void fetchDevotionToday()
      .then((d) => {
        setDevotion(d.devotion ? DOMPurify.sanitize(d.devotion) : null);
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

  // Same element across loading → loaded, so the song keeps playing (and its listeners stay).
  const audio = <audio ref={songRef} src={DEVOTIONAL_SONG_SRC} loop preload="auto" />;

  if (loading) {
    return (
      <>
        {audio}
        <div className="flex min-h-screen items-center justify-center bg-[var(--vq-canvas)] text-[var(--vq-muted)]">
          {m.devotionLoadingText}
        </div>
      </>
    );
  }

  return (
    <>
    {audio}
    <div className="min-h-dvh bg-[var(--vq-canvas)] px-4">
      {/* Full-height column so the bar sits at the bottom even when the devotion is short */}
      <div className="mx-auto flex min-h-dvh max-w-[390px] flex-col pt-8">
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
            <div
              className="vq-devotion-body whitespace-pre-wrap break-words leading-[1.8] text-[15px] text-[var(--vq-text)]"
              dangerouslySetInnerHTML={{ __html: devotion }}
            />
          </div>
        ) : (
          <div className="mb-6 rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)] p-6">
            <p className="text-[var(--vq-muted)]">{m.devotionUnavailable}</p>
          </div>
        )}

        <SongActionBar
          songPlaying={songPlaying}
          onToggleSong={toggleSong}
          actionLabel={m.devotionMarkRead}
          onAction={markAsRead}
          actionDisabled={!devotion}
          surfaceClassName="mt-auto -mx-4 px-4 bg-[var(--vq-canvas)] before:from-[var(--vq-canvas)]"
        />
      </div>
    </div>
    </>
  );
}
