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
    <div style={{ minHeight: 'min(100dvh, 880px)', background: 'var(--color-bg-page)', paddingBottom: 24, position: 'relative' }}>
      <div className="vq-grain" />

      {/* Header */}
      <div className="vq-header">
        <div className="vq-header-row">
          <div>
            <div className="vq-title">{m.communityTitle}</div>
            <div className="vq-subtitle">{m.communitySubtitle}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px var(--space-page-x) 0', position: 'relative' }}>
        {items === null ? (
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{m.communityLoading}</p>
        ) : showEmpty ? (
          <p style={{ textAlign: 'center', fontSize: 15, lineHeight: 1.6, color: 'var(--color-text-muted)', paddingTop: 48 }}>
            {m.communityEmptyExact}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item) => {
              const label = item.book
                ? `${bookDisplayName(item.book, locale)} ${item.chapter}:${item.verse}`
                : `${item.chapter}:${item.verse}`;
              const key = `${item.book}-${item.chapter}-${item.verse}-${item.submitted_at}`;
              const dateLabel = item.submitted_at
                ? new Date(item.submitted_at + "T00:00:00").toLocaleDateString(
                    locale === "id" ? "id-ID" : "en-US",
                    { day: "numeric", month: "long", year: "numeric" }
                  )
                : null;

              return (
                <div key={key} className="vq-card" style={{ position: 'relative' }}>
                  {/* watermark quote mark */}
                  <div aria-hidden style={{
                    position: 'absolute', top: 10, right: 14,
                    fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1,
                    color: 'var(--color-primary)', opacity: 0.1, fontWeight: 700,
                    pointerEvents: 'none',
                  }}>
                    &ldquo;
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="vq-badge soft" style={{ whiteSpace: 'nowrap' }}>{label}</span>
                    {dateLabel && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{dateLabel}</span>
                    )}
                  </div>
                  {item.verse_text ? (
                    <div className="vq-quote">{item.verse_text}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
