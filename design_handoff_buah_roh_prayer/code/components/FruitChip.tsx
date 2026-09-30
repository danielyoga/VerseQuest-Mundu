// components/FruitChip.tsx — used on the prayer page header and the dashboard.
'use client';
import { useEffect, useState } from 'react';
import { getFruitState, toLocalDateStr, type FruitView } from '@/lib/fruitStreak';

type Props = { phone: string; refreshKey?: number; showHint?: boolean };

export default function FruitChip({ phone, refreshKey = 0, showHint = false }: Props) {
  const [view, setView] = useState<FruitView | null>(null);

  useEffect(() => {
    const read = () => setView(getFruitState(phone, toLocalDateStr(new Date())));
    read();
    window.addEventListener('focus', read); // app left open overnight → date stays current
    return () => window.removeEventListener('focus', read);
  }, [phone, refreshKey]);

  if (!view) return null;

  const fresh = view.isBroken || view.streak === 0;
  const label = fresh
    ? 'Mulai hari ini 🙏'
    : `${view.fruit.emoji} ${view.fruit.name} • Hari ${view.dayInFruit}/7`;

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="whitespace-nowrap rounded-full bg-[var(--vq-brand-tint)] px-3 py-1.5 text-[13px] font-medium text-[var(--vq-brand)]">
        {label}
      </span>
      {showHint && !fresh && !view.amenDoneToday && (
        <span className="text-[12px] text-[var(--vq-muted)]">Belum berdoa hari ini</span>
      )}
    </div>
  );
}
