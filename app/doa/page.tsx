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
        className="mx-auto flex min-h-dvh max-w-[390px] flex-col gap-[14px] px-7 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]"
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
            className="m-0 min-h-[1.6em] whitespace-pre-line text-[24px] font-medium leading-[1.6] text-[var(--vq-text)] [text-wrap:pretty]">
            {prayer?.text ?? ""}
          </p>
          <div aria-hidden className="h-[2px] w-10 rounded-sm bg-[var(--vq-brand)]" />
          <p className="m-0 text-[14px] leading-[1.625] text-[var(--vq-muted)]">{m.prayerHint}</p>
        </section>

        <button
          ref={amenRef}
          type="button"
          onClick={onAmen}
          disabled={!phone || !prayer}
          className="min-h-[56px] w-full rounded-2xl bg-[var(--vq-brand)] text-[18px] font-medium text-white transition-colors hover:bg-[var(--vq-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vq-brand)] active:scale-[0.98] disabled:opacity-60"
        >
          {m.prayerAmen}
        </button>
      </main>

      <FruitOfSpiritCard result={result} playKey={playKey} onClose={closeCard} onDone={finishCard} />
    </div>
  );
}
