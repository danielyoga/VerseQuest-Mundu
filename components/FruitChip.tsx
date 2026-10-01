"use client";

import { useLocale } from "@/contexts/LocaleContext";
import type { FruitView } from "@/lib/fruitStreak";
import { messages } from "@/lib/i18n";

type Props = { view: FruitView; size?: "md" | "sm" };

/** "{emoji} {fruit} • Hari {d}/7", or "Mulai hari ini 🙏" when there is no unbroken streak. */
export function FruitChip({ view, size = "md" }: Props) {
  const { locale } = useLocale();
  const m = messages[locale];

  const fresh = view.isBroken || view.streak === 0;
  const name = locale === "en" ? view.fruit.en : view.fruit.name;
  const label = fresh ? m.fruitChipStart : m.fruitChipDay(view.fruit.emoji, name, view.dayInFruit);

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full bg-[var(--vq-brand-tint)] font-medium text-[var(--vq-brand)] ${
        size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]"
      }`}
    >
      {label}
    </span>
  );
}
