"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { bookDisplayName } from "@/lib/bible/book-names-id";
import { messages } from "@/lib/i18n";
import type { CommunityVerseItem } from "@/lib/google-sheets/community-verse-sheet";

export function CommunityVerses() {
  const { locale } = useLocale();
  const m = messages[locale];
  const [items, setItems] = useState<CommunityVerseItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    function load() {
      void fetch("/api/community-verses", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: { verses?: CommunityVerseItem[] }) => {
          if (!cancelled) setItems(Array.isArray(d.verses) ? d.verses : []);
        })
        .catch(() => { if (!cancelled) setItems([]); });
    }

    load();
    function onRefresh() { load(); }
    window.addEventListener("versequest-community-refresh", onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener("versequest-community-refresh", onRefresh);
    };
  }, []);

  const showEmpty = items !== null && items.length === 0;

  return (
    <div className="min-h-[min(100dvh,880px)] bg-[var(--vq-canvas)] px-4 py-6">
      <div className="mx-auto max-w-[390px]">
        <header className="mb-5">
          <h1 className="text-[22px] font-medium text-[var(--vq-text)]">{m.communityTitle}</h1>
          <p className="mt-1 text-sm leading-relaxed text-[var(--vq-muted)]">{m.communitySubtitle}</p>
        </header>

        {items === null ? (
          <p className="text-sm text-[var(--vq-muted)]">{m.communityLoading}</p>
        ) : showEmpty ? (
          <p className="text-center text-[15px] leading-relaxed text-[var(--vq-muted)]">
            {m.communityEmptyExact}
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const label = item.book
                ? `${bookDisplayName(item.book, locale)} ${item.chapter}:${item.verse}`
                : `${item.chapter}:${item.verse}`;
              const key = `${item.book}-${item.chapter}-${item.verse}-${item.submitted_at}`;
              return (
                <li
                  key={key}
                  className="rounded-[var(--vq-radius-lg)] border border-[var(--vq-border)] bg-[var(--vq-bg)] px-4 py-3 shadow-sm"
                >
                  <p className="text-[15px] font-semibold text-[#534AB7]">{label}</p>
                  {item.verse_text ? (
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--vq-text)]">{item.verse_text}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
