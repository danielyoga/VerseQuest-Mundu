// app/doa/page.tsx — Prayer page "Lembut netral, fokus" (4c)
// Replace useSession / getTodayPrayer with the app's real session + content sources.
'use client';
import { useCallback, useEffect, useState } from 'react';
import FruitOfSpiritCard from '@/components/FruitOfSpiritCard';
import FruitChip from '@/components/FruitChip';
import { recordAmen, toLocalDateStr, type AmenResult } from '@/lib/fruitStreak';
import { useSession } from '@/lib/session';            // TODO: existing session hook
import { getTodayPrayer } from '@/lib/prayers';         // TODO: existing / new prayer content

export default function PrayerPage() {
  const session = useSession();
  const [result, setResult] = useState<AmenResult | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [chipKey, setChipKey] = useState(0);
  const prayer = getTodayPrayer(new Date()); // { label: 'Doa Pagi' | 'Doa Malam', text: string }

  const onAmen = () => {
    if (!session?.phone) return;
    const r = recordAmen(session.phone, toLocalDateStr(new Date()));
    setResult(r);            // show the card even when r.advanced === false
    setPlayKey(k => k + 1);  // replay animation on every tap
    setChipKey(k => k + 1);  // refresh chip behind the overlay
  };

  const onClose = useCallback(() => {
    setResult(null);
    requestAnimationFrame(() => document.getElementById('amen-btn')?.focus());
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[390px] flex-col gap-[14px] bg-[var(--vq-bg-2)] px-7 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium uppercase leading-4 tracking-[0.025em] text-[var(--vq-muted)]">
          {prayer.label}
        </span>
        {session?.phone && <FruitChip phone={session.phone} refreshKey={chipKey} />}
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div aria-hidden className="h-[2px] w-10 rounded-sm bg-[var(--vq-brand)]" />
        <p className="m-0 text-[24px] font-medium leading-[1.6] text-[var(--vq-text)] [text-wrap:pretty]">
          {prayer.text}
        </p>
        <div aria-hidden className="h-[2px] w-10 rounded-sm bg-[var(--vq-brand)]" />
        <p className="m-0 text-[14px] leading-[1.625] text-[var(--vq-muted)]">
          Bacalah perlahan, lalu tekan Amen.
        </p>
      </section>

      <button
        id="amen-btn"
        type="button"
        onClick={onAmen}
        className="min-h-[56px] w-full rounded-2xl bg-[var(--vq-brand)] text-[18px] font-medium text-white transition-colors hover:bg-[var(--vq-brand-hover)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vq-brand)]"
      >
        Amen 🙏
      </button>

      <FruitOfSpiritCard result={result} playKey={playKey} onClose={onClose} />
    </main>
  );
}
