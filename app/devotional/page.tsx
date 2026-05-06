"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTodayString } from "@/lib/sheetName";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import { GBack, GCheck } from "@/components/ui/Glyphs";

// ─── DevotionalPage ───────────────────────────────────────────────────────────

export default function DevotionalPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const m = messages[locale];
  const todayStr = getTodayString();

  const [devotion, setDevotion] = useState<string | null>(null);
  const [devotionTitle, setDevotionTitle] = useState<string | null>(null);
  const [reflection, setReflection] = useState<string[]>([]);
  const [verseRef, setVerseRef] = useState<string | null>(null);
  const [verseText, setVerseText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [markedRead, setMarkedRead] = useState(false);

  useEffect(() => {
    try {
      const readKey = `versequest_devotion_${todayStr}`;
      setMarkedRead(localStorage.getItem(readKey) === "read");
    } catch {}
  }, [todayStr]);

  useEffect(() => {
    void fetch("/api/devotion/today", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { devotion?: string | null; devotionTitle?: string | null; reflection?: string[]; verseRef?: string | null; verseText?: string | null }) => {
        setDevotion(d.devotion ?? null);
        setDevotionTitle(d.devotionTitle ?? null);
        setReflection(Array.isArray(d.reflection) ? d.reflection : []);
        setVerseRef(d.verseRef ?? null);
        setVerseText(d.verseText ?? null);
      })
      .catch(() => setDevotion(null))
      .finally(() => setLoading(false));
  }, []);

  function markAsRead() {
    const readKey = `versequest_devotion_${todayStr}`;
    localStorage.setItem(readKey, "read");
    window.dispatchEvent(new StorageEvent("storage", { key: readKey, newValue: "read", storageArea: localStorage }));
    setMarkedRead(true);
    setTimeout(() => router.back(), 400);
  }

  const dateLabel = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(new Date());

  const paras = devotion
    ? devotion.split(/\n\n+/).map((chunk) => chunk.trim()).filter(Boolean)
    : [];

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", background: "var(--color-bg-page)", color: "var(--color-text-muted)" }}>
        {m.devotionLoadingText}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--color-bg-page)", position: "relative" }}>
      {/* HEADER */}
      <div className="vq-header">
        <div className="vq-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button
              className="vq-tap"
              onClick={() => router.back()}
              aria-label={m.devotionBackAria}
              style={{ background: "transparent", border: "none", padding: 4, marginLeft: -4, cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center" }}
            >
              <GBack size={22} />
            </button>
            <div style={{ minWidth: 0 }}>
              <div className="vq-title">{m.devotionNavTitle}</div>
              <div className="vq-subtitle">{dateLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="vq-scroll" style={{ paddingBottom: 110, paddingTop: 8, position: "relative" }}>
        <div className="vq-grain" />
        <article style={{ padding: "14px var(--space-page-x) 0" }}>

          {verseRef && (
            <div className="vq-badge soft" style={{ marginBottom: 12 }}>{verseRef}</div>
          )}

          {devotionTitle && (
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.2, letterSpacing: -0.01, margin: 0, textWrap: "balance" } as React.CSSProperties}>
              {devotionTitle}
            </h2>
          )}

          {verseText && (
            <blockquote style={{ margin: "20px 0 0", padding: "14px 18px", borderLeft: "3px solid var(--color-primary)", background: "var(--color-primary-soft)", borderRadius: "0 12px 12px 0" }}>
              <div className="vq-quote" style={{ fontStyle: "italic" }}>{verseText}</div>
              {verseRef && (
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-primary)", fontWeight: 700 }}>{verseRef}</div>
              )}
            </blockquote>
          )}

          {paras.length === 0 && (
            <p style={{ color: "var(--color-text-muted)", fontSize: 15, marginTop: 20 }}>{m.devotionUnavailable}</p>
          )}

          {paras.length > 0 && (
            <div style={{ marginTop: 18, fontSize: 15.5, lineHeight: 1.7, color: "var(--color-text-body)" }}>
              {paras.map((text, i) => (
                <p key={i} style={{ margin: i < paras.length - 1 ? "0 0 14px" : 0 }}>{text}</p>
              ))}
            </div>
          )}

          {reflection.length > 0 && (
            <div style={{ marginTop: 22, padding: 16, borderRadius: 14, background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 8 }}>
                Refleksi
              </div>
              <div style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.6 }}>
                {reflection[0]}
              </div>
            </div>
          )}

        </article>
      </div>

      {/* STICKY CTA */}
      <div
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px var(--space-page-x) 16px", background: "color-mix(in oklab, var(--color-bg-card) 92%, transparent)", backdropFilter: "blur(14px)", borderTop: "1px solid var(--color-border)", zIndex: 30 }}
      >
        <button
          className="vq-cta vq-tap"
          onClick={markedRead ? () => router.back() : markAsRead}
          style={{ background: markedRead ? "var(--color-success)" : "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          {markedRead ? (
            <>
              <GCheck color="#fff" stroke={2.5} />
              {m.devotionMarkedRead}
            </>
          ) : (
            m.devotionMarkRead
          )}
        </button>
      </div>
    </div>
  );
}
