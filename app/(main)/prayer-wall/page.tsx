"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { messages, type Locale } from "@/lib/i18n";
import { CreatePrayerModal } from "@/components/CreatePrayerModal";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import type { Prayer } from "@/app/api/prayer-wall/route";

const LIKES_KEY = "prayer_wall_likes";

function getLikedSet(): Set<number> {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikedSet(set: Set<number>) {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify([...set]));
  } catch {}
}

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
  const [likedSet, setLikedSet] = useState<Set<number>>(new Set());
  const [answering, setAnswering] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setLikedSet(getLikedSet());
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as { profile?: { name?: string } }) : null;
      if (parsed?.profile?.name) setUserName(parsed.profile.name);
    } catch {}
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    void fetch("/api/prayer-wall", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { prayers?: Prayer[] }) => {
        const all = (data.prayers ?? []).filter((p) => !p.answered);
        const own = all.filter((p) => p.username === userName);
        const other = all.filter((p) => p.username !== userName);
        setPrayers([...own, ...other]);
      })
      .catch(() => setPrayers([]))
      .finally(() => setLoading(false));
  }, [userName]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const toggleLike = (rowIndex: number) => {
    setLikedSet((prev) => {
      const next = new Set(prev);
      next.has(rowIndex) ? next.delete(rowIndex) : next.add(rowIndex);
      saveLikedSet(next);
      return next;
    });
  };

  const markAnswered = async (prayer: Prayer) => {
    if (!userName) return;
    setAnswering(prayer.rowIndex);
    try {
      const res = await fetch("/api/prayer-wall", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: prayer.rowIndex, username: userName }),
      });
      if (res.ok) refetch();
    } finally {
      setAnswering(null);
    }
  };

  return (
    <div className="min-h-[min(100dvh,880px)] bg-[var(--vq-canvas)] px-4 py-6">
      <div className="mx-auto max-w-[390px]">
        <header className="mb-5" suppressHydrationWarning>
          <h1
            className="text-[22px] font-medium text-[var(--vq-text)]"
            suppressHydrationWarning
          >
            {m.prayerWallTitle}
          </h1>
          <p
            className="mt-1 text-sm leading-relaxed text-[var(--vq-muted)]"
            suppressHydrationWarning
          >
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
          <ul className="space-y-3 pb-24">
            {prayers.map((prayer, i) => {
              const isOwn = prayer.username === userName;
              const isLiked = likedSet.has(prayer.rowIndex);
              const isAnswering = answering === prayer.rowIndex;

              return (
                <li
                  key={`${prayer.rowIndex}-${i}`}
                  className="relative rounded-[var(--vq-radius-lg)] px-4 py-3 shadow-sm"
                  style={{
                    border: `2px solid ${isOwn ? "#534AB7" : "var(--vq-border)"}`,
                    background: "var(--vq-bg)",
                  }}
                >
                  {/* Badges */}
                  {isOwn && (
                    <span
                      className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                      style={{ background: "#534AB7" }}
                    >
                      {m.prayerWallBadgeOwn}
                    </span>
                  )}

                  {/* Username + ranting */}
                  <div className="mb-2 flex items-center gap-1.5 pr-20">
                    <span className="text-[14px] font-semibold text-[#534AB7]">
                      {prayer.username}
                    </span>
                    {prayer.ranting && (
                      <span className="text-[12px] text-[var(--vq-muted)]">
                        · {prayer.ranting}
                      </span>
                    )}
                  </div>

                  {/* Prayer text */}
                  <p className="text-[14px] leading-relaxed text-[var(--vq-text)]">
                    {prayer.prayer_request}
                  </p>

                  {/* Footer: time + buttons */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] text-[var(--vq-muted)]">
                      {relativeTime(prayer.submitted_at, m)}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleLike(prayer.rowIndex)}
                        className="rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors"
                        style={{
                          background: isLiked ? "#534AB7" : "transparent",
                          color: isLiked ? "#fff" : "#534AB7",
                          border: "1px solid #534AB7",
                        }}
                      >
                        {isLiked ? m.prayerWallAminActive : m.prayerWallAmin}
                      </button>

                      {isOwn && !prayer.answered && (
                        <button
                          onClick={() => void markAnswered(prayer)}
                          disabled={isAnswering}
                          className="rounded-lg px-2.5 py-1 text-[12px] font-medium transition-opacity disabled:opacity-50"
                          style={{ color: "#16a34a", border: "1px solid #16a34a" }}
                        >
                          {isAnswering
                            ? m.prayerWallMarkAnswering
                            : m.prayerWallMarkAnswered}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {userName && (
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
      )}

      <CreatePrayerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
