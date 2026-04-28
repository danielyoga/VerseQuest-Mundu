"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { messages, type Locale } from "@/lib/i18n";
import { CreatePrayerModal } from "@/components/CreatePrayerModal";
import type { Prayer } from "@/app/api/prayer-wall/route";

function relativeTime(isoString: string, m: (typeof messages)[Locale]): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return m.prayerWallJustNow;
  if (mins < 60) return m.prayerWallMinutesAgo(mins);
  if (hours < 24) return m.prayerWallHoursAgo(hours);
  if (days === 1) return m.prayerWallYesterday;
  return m.prayerWallDaysAgo(days);
}

export default function PrayerWallPage() {
  const { locale } = useLocale();
  const m = messages[locale];
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const refetch = useCallback(() => {
    setLoading(true);
    void fetch("/api/prayer-wall", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { prayers?: Prayer[] }) => {
        setPrayers(data.prayers ?? []);
      })
      .catch(() => setPrayers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-[min(100dvh,880px)] bg-[var(--vq-canvas)] px-4 py-6">
      <div className="mx-auto max-w-[390px]">
        <header className="mb-5">
          <h1 className="text-[22px] font-medium text-[var(--vq-text)]">
            {m.prayerWallTitle}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-[var(--vq-muted)]">
            {m.prayerWallSubtitle}
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-[var(--vq-muted)]">{m.loading}</p>
        ) : prayers.length === 0 ? (
          <p className="text-center text-[15px] leading-relaxed text-[var(--vq-muted)]">
            {m.prayerWallEmpty}
          </p>
        ) : (
          <ul className="space-y-3">
            {prayers.map((prayer, i) => (
              <li
                key={`${prayer.submitted_at}-${i}`}
                className="rounded-[var(--vq-radius-lg)] border border-[var(--vq-border)] bg-[var(--vq-bg)] px-4 py-3 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="text-base leading-none">🙏</span>
                  <span className="text-[14px] font-semibold text-[#534AB7]">
                    {prayer.username}
                  </span>
                </div>
                <p className="text-[14px] leading-relaxed text-[var(--vq-text)]">
                  {prayer.prayer_request}
                </p>
                <p className="mt-2 text-[12px] text-[var(--vq-muted)]">
                  {relativeTime(prayer.submitted_at, m)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Floating add button */}
      <button
        onClick={() => setModalOpen(true)}
        style={{
          position: "fixed",
          bottom: 80,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#534AB7",
          color: "#ffffff",
          fontSize: 28,
          fontWeight: 300,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(83,74,183,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
        }}
        aria-label={m.prayerWallAddAria}
      >
        +
      </button>

      <CreatePrayerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
