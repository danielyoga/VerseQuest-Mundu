"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FruitChip } from "@/components/FruitChip";
import { FruitOfSpiritCard } from "@/components/FruitOfSpiritCard";
import { useLocale } from "@/contexts/LocaleContext";
import { useFitFontSize } from "@/hooks/useFitFontSize";
import { useFruitView } from "@/hooks/useFruitView";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { recordAmen, toLocalDateStr, type AmenResult } from "@/lib/fruitStreak";
import { messages } from "@/lib/i18n";
import type { PrayerPayload } from "@/lib/prayer-content";
import { fetchTodayPrayer, getInitialPrayer } from "@/lib/prayers";

/** Marks the history entry pushed while the card is open, so Android back closes the card. */
const CARD_HISTORY_KEY = "vqFruitCard";

const PRAYER_SONG_SRC = "/audio/doa-1001.mp3";
/** "off" once the user pauses the song, so it doesn't start by itself on later visits. */
const MUSIC_PREF_KEY = "vq_prayer_music";

function readProfilePhone(): string | null {
  try {
    const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { profile?: { phone?: string } }) : null;
    return parsed?.profile?.phone || null;
  } catch {
    return null;
  }
}

/** Daily prayer page — design 4c "Lembut netral, fokus". */
export default function PrayerPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const m = messages[locale];

  const [phone, setPhone] = useState<string | null>(null);
  const [prayer, setPrayer] = useState<PrayerPayload | null>(null);
  const [result, setResult] = useState<AmenResult | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [chipKey, setChipKey] = useState(0);
  const amenRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicOn, setMusicOn] = useState(false);
  // Set by Tutup: the next popstate (our card entry) continues on to the home screen.
  const goHomeAfterPop = useRef(false);
  const view = useFruitView(phone, chipKey);

  // Long prayers shrink so the whole page — Amen included — fits on one screen.
  const pageFits = useCallback(
    () => (mainRef.current?.scrollHeight ?? 0) <= window.innerHeight,
    []
  );
  useFitFontSize(textRef, pageFits, prayer?.text ?? "");

  useEffect(() => {
    const p = readProfilePhone();
    if (!p) {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setPhone(p);
    // Cached or default text right away — Amen never waits on the network.
    setPrayer(getInitialPrayer());
    let cancelled = false;
    void fetchTodayPrayer(toLocalDateStr(new Date())).then((fresh) => {
      if (!cancelled) setPrayer(fresh);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Song: try to start on open (browsers may block sound until a tap — then the button starts it).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setMusicOn(true);
    const onPause = () => setMusicOn(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    let wantsMusic = true;
    try {
      wantsMusic = localStorage.getItem(MUSIC_PREF_KEY) !== "off";
    } catch {
      /* storage unavailable: default to playing */
    }
    if (wantsMusic) void audio.play().catch(() => {});
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
    };
  }, []);

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    const next = audio.paused;
    if (next) void audio.play().catch(() => {});
    else audio.pause();
    try {
      localStorage.setItem(MUSIC_PREF_KEY, next ? "on" : "off");
    } catch {
      /* ignore */
    }
  }

  // While the card is open it owns one history entry: back (Android) pops it and closes the card.
  useEffect(() => {
    if (!result) return;
    window.history.pushState({ [CARD_HISTORY_KEY]: true }, "");
    const onPop = () => {
      if (goHomeAfterPop.current) {
        goHomeAfterPop.current = false;
        router.replace("/"); // swap /doa for home, so back from home doesn't reopen the prayer
        return;
      }
      setResult(null);
      requestAnimationFrame(() => amenRef.current?.focus());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [result, router]);

  const closeCard = useCallback(() => {
    if ((window.history.state as Record<string, unknown> | null)?.[CARD_HISTORY_KEY]) {
      window.history.back(); // popstate above closes the card
    } else {
      setResult(null);
      requestAnimationFrame(() => amenRef.current?.focus());
    }
  }, []);

  /** Tutup: done praying — drop the card's history entry, then go home. */
  const finishCard = useCallback(() => {
    if ((window.history.state as Record<string, unknown> | null)?.[CARD_HISTORY_KEY]) {
      goHomeAfterPop.current = true;
      window.history.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  function onAmen() {
    if (!phone) return;
    const r = recordAmen(phone, toLocalDateStr(new Date()));
    setResult(r); // shown even when r.advanced is false (same-day repeat)
    setPlayKey((k) => k + 1);
    setChipKey((k) => k + 1);
  }

  return (
    <div className="min-h-dvh bg-[var(--vq-bg-2)]">
      <main
        ref={mainRef}
        inert={result !== null}
        className="mx-auto flex min-h-dvh max-w-[390px] flex-col gap-[14px] px-7 pt-[max(24px,env(safe-area-inset-top))]"
      >
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Link
              href="/"
              prefetch={false}
              aria-label={m.prayerBackAria}
              className="-ml-3 flex h-11 w-11 items-center justify-center rounded-full text-[var(--vq-muted)] hover:bg-[var(--vq-bg)]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M11 14l-5-5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <span className="text-[12px] font-medium uppercase leading-4 tracking-[0.025em] text-[var(--vq-muted)]">
              {m.prayerEyebrow}
            </span>
          </div>
          {view && <FruitChip view={view} />}
        </header>

        <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div aria-hidden className="h-[2px] w-10 rounded-sm bg-[var(--vq-brand)]" />
          <p
            ref={textRef}
            className="m-0 min-h-[1.6em] whitespace-pre-line text-[24px] font-normal leading-[1.6] text-[var(--vq-text)] [text-wrap:pretty]">
            {prayer?.text ?? ""}
          </p>
          <div aria-hidden className="h-[2px] w-10 rounded-sm bg-[var(--vq-brand)]" />
          <p className="m-0 text-[14px] leading-[1.625] text-[var(--vq-muted)]">{m.prayerHint}</p>
        </section>

        {/* Pinned to the bottom: if a prayer is too long even at the smallest size, the text
            scrolls under a short fade and Amen stays reachable. */}
        <div className="sticky bottom-0 -mx-7 flex gap-3 bg-[var(--vq-bg-2)] px-7 pb-[max(24px,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-linear-to-t before:from-[var(--vq-bg-2)] before:to-transparent">
          <button
            type="button"
            onClick={toggleMusic}
            aria-pressed={musicOn}
            aria-label={musicOn ? m.prayerMusicPause : m.prayerMusicPlay}
            title={musicOn ? m.prayerMusicPause : m.prayerMusicPlay}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--vq-brand-tint)] text-[var(--vq-brand)] transition-colors hover:bg-[#dedcfb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vq-brand)] active:scale-[0.98]"
          >
            {musicOn ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" aria-hidden>
                <rect x="5.5" y="4.5" width="3.5" height="13" rx="1.2" />
                <rect x="13" y="4.5" width="3.5" height="13" rx="1.2" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path d="M9 16.5V5.2l8.5-1.7v11.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6.8" cy="16.5" r="2.4" fill="currentColor" />
                <circle cx="15.3" cy="14.8" r="2.4" fill="currentColor" />
              </svg>
            )}
          </button>
          <button
            ref={amenRef}
            type="button"
            onClick={onAmen}
            disabled={!phone || !prayer}
            className="min-h-[56px] min-w-0 flex-1 rounded-2xl bg-[var(--vq-brand)] text-[18px] font-medium text-white transition-colors hover:bg-[var(--vq-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vq-brand)] active:scale-[0.98] disabled:opacity-60"
          >
            {m.prayerAmen}
          </button>
        </div>
      </main>

      {/* Looping prayer song; stops when the page unmounts. */}
      <audio ref={audioRef} src={PRAYER_SONG_SRC} loop preload="auto" />

      <FruitOfSpiritCard result={result} playKey={playKey} onClose={closeCard} onDone={finishCard} />
    </div>
  );
}
